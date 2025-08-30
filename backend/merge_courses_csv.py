#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge same-base-name courses whose differences are only bracketed suffixes
(e.g., "電路原理(2016_T2)", "電路原理（2016春）", "電路原理（2016秋）")
into the latest course_id, and aggregate user interactions accordingly.

- 先移除課程名稱中的所有括號（()、（）、[]、【】、{}、｛｝）做 base name 分組
- 同一個 base name 裡，挑最新的課程規則：
    1. 年份 DESC（從 course_info 欄位或名稱中擷取）
    2. 季別/期別權重 DESC（冬=4 > 秋=3 > 夏=2 > 春=1；T1/T2 → 數字）
    3. start_date DESC
    4. course_id DESC
- 使用者互動彙總規則：
    * action_* 欄位：SUM
    * unique_session_count：COUNT DISTINCT session_id
    * avg_nActions_per_session：總 action 數 ÷ session 數
    * time_difference：SUM
    * truth：MAX (0/1)
    * timestamp：first_seen_at=min, last_seen_at=max
"""

import argparse
import re
import sys
import pandas as pd
import numpy as np
from pathlib import Path

# 偵測 4 位數年份
YEAR_RE = re.compile(r'(?:19|20)\d{2}')
# 括號內容（含全形）
BRACKETS_RE = re.compile(r'[\(\（\[\【\{\｛].*?[\)\）\]\】\}\｝]')

def find_col(df, candidates, required=False, default=None):
    cols_lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in cols_lower:
            return cols_lower[cand.lower()]
    if required:
        raise KeyError(f"Required column not found: {candidates}")
    return default

def base_course_name(name):
    """去掉括號後的課程名稱，作為分組 key"""
    if pd.isna(name):
        return name
    s = str(name)
    s = BRACKETS_RE.sub(' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s.casefold()

def extract_year_and_term(name):
    """從課名裡抓年份與期別權重"""
    if pd.isna(name):
        return np.nan, np.nan
    s = str(name)
    years = YEAR_RE.findall(s)
    year = int(years[-1]) if years else np.nan
    term_w = np.nan
    # T1/T2
    m = re.search(r'[Tt]\s*[_\-]?\s*(\d+)', s)
    if m:
        term_w = float(m.group(1))
    if '冬' in s: term_w = max(term_w or 0, 4)
    if '秋' in s: term_w = max(term_w or 0, 3)
    if '夏' in s: term_w = max(term_w or 0, 2)
    if '春' in s: term_w = max(term_w or 0, 1)
    return year, term_w

def to_datetime_safe(series):
    return pd.to_datetime(series, errors='coerce')

def coerce_numeric(series, default=0):
    return pd.to_numeric(series, errors='coerce').fillna(default)

def main(args):
    df_ev = pd.read_csv(args.interactions)
    df_course = pd.read_csv(args.courses)

    # 課程欄位
    course_id_col = find_col(df_course, ['course_id','id'], required=True)
    course_name_col = find_col(df_course, ['course_name','name','title','normalized_name'], required=True)
    year_col = find_col(df_course, ['year','course_year'], required=False)
    start_date_col = find_col(df_course, ['start_date','start'], required=False)

    # base name
    df_course['_base_name'] = df_course[course_name_col].map(base_course_name)
    # 年份
    if year_col is None:
        df_course['_year'] = pd.to_numeric(df_course[course_name_col].map(lambda x: extract_year_and_term(x)[0]), errors='coerce')
        year_col = '_year'
    else:
        df_course[year_col] = coerce_numeric(df_course[year_col], default=np.nan)
    # term
    df_course['_term_w'] = pd.to_numeric(df_course[course_name_col].map(lambda x: extract_year_and_term(x)[1]), errors='coerce')
    # start date
    if start_date_col is not None:
        df_course['_start'] = to_datetime_safe(df_course[start_date_col])

    # 挑 winner
    sort_by = [year_col,'_term_w']
    ascending = [False,False]
    if start_date_col: 
        sort_by.append('_start'); ascending.append(False)
    sort_by.append(course_id_col); ascending.append(False)
    df_sorted = df_course.sort_values(sort_by, ascending=ascending, kind='mergesort')
    winners = df_sorted.drop_duplicates(subset=['_base_name'], keep='first')\
                       [['_base_name',course_id_col]].rename(columns={course_id_col:'to_course_id'})
    mapping = df_course.merge(winners,on='_base_name',how='left')
    mapping = mapping.rename(columns={course_id_col:'from_course_id'})
    mapping = mapping[mapping['from_course_id']!=mapping['to_course_id']][['from_course_id','to_course_id','_base_name']]

    # 使用者互動
    user_col = find_col(df_ev,['username','user'],required=True)
    course_ev_col = find_col(df_ev,['course_id','cid'],required=True)
    session_col = find_col(df_ev,['session_id'],required=False)
    truth_col = find_col(df_ev,['truth','completed'],required=False)
    time_diff_col = find_col(df_ev,['time_difference','duration'],required=False)
    timestamp_col = find_col(df_ev,['timestamp','ts','time'],required=False)
    action_cols = [c for c in df_ev.columns if c.lower().startswith('action_')]
    for c in action_cols:
        df_ev[c]=coerce_numeric(df_ev[c],0)

    # 改 course_id
    map_dict=dict(zip(mapping['from_course_id'],mapping['to_course_id']))
    df_ev['_target_course_id']=df_ev[course_ev_col].map(lambda x:map_dict.get(x,x))
    if timestamp_col: df_ev['_ts']=to_datetime_safe(df_ev[timestamp_col])
    if time_diff_col: df_ev['_time_diff']=coerce_numeric(df_ev[time_diff_col],0)
    if truth_col:
        def truthy(v):
            if pd.isna(v): return 0
            s=str(v).strip().lower()
            return 1 if s in {'1','true','yes','y','完成','done','passed','complete','completed'} else 0
        df_ev['_truth']=df_ev[truth_col].map(truthy)

    # 去重
    dup_keys=[user_col,'_target_course_id']+action_cols
    if session_col: dup_keys.append(session_col)
    if timestamp_col: dup_keys.append('_ts')
    if time_diff_col: dup_keys.append('_time_diff')
    if truth_col: dup_keys.append('_truth')
    df_ev=df_ev.drop_duplicates(subset=dup_keys)

    # 聚合
    g=df_ev.groupby([user_col,'_target_course_id'])
    summed=g[action_cols].sum().reset_index()
    if session_col: uniq=g[session_col].nunique().rename('unique_session_count').reset_index()
    else: uniq=summed[[user_col,'_target_course_id']].assign(unique_session_count=1)
    if time_diff_col: total=g['_time_diff'].sum().rename('total_time_difference').reset_index()
    else: total=summed[[user_col,'_target_course_id']].assign(total_time_difference=0)
    if timestamp_col:
        first=g['_ts'].min().rename('first_seen_at').reset_index()
        last=g['_ts'].max().rename('last_seen_at').reset_index()
    else:
        first=summed[[user_col,'_target_course_id']].assign(first_seen_at=pd.NaT)
        last=summed[[user_col,'_target_course_id']].assign(last_seen_at=pd.NaT)
    if truth_col:
        truth=g['_truth'].max().rename('truth').reset_index()
    else:
        truth=summed[[user_col,'_target_course_id']].assign(truth=np.nan)

    merged=summed.merge(uniq,on=[user_col,'_target_course_id'])\
                 .merge(total,on=[user_col,'_target_course_id'])\
                 .merge(first,on=[user_col,'_target_course_id'])\
                 .merge(last,on=[user_col,'_target_course_id'])\
                 .merge(truth,on=[user_col,'_target_course_id'])
    merged['total_actions']=merged[action_cols].sum(axis=1)
    merged['avg_nActions_per_session']=merged['total_actions']/merged['unique_session_count'].replace(0,np.nan)
    merged=merged.rename(columns={'_target_course_id':'course_id'})

    # 輸出
    merged.to_csv(args.out_interactions,index=False,encoding='utf-8-sig')
    mapping.to_csv(args.out_mapping,index=False,encoding='utf-8-sig')
    print("==== Done ====")
    print(f"輸出互動檔: {args.out_interactions}")
    print(f"輸出映射檔: {args.out_mapping}")
    print(f"合併後課程數: {merged['course_id'].nunique()}")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--interactions",required=True)
    p.add_argument("--courses",required=True)
    p.add_argument("--out_interactions",default="user_course_events_merged.csv")
    p.add_argument("--out_mapping",default="course_id_merge.csv")
    args=p.parse_args()
    main(args)
