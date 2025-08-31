#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge same-base-name courses whose differences are only bracketed suffixes
(e.g., "電路原理(2016_T2)", "電路原理（2016春）", "電路原理（2016秋）")
into the latest course_id, and aggregate user interactions accordingly.

變更重點：
- 先移除課程名稱中的所有括號（()、（）、[]、【】、{}、｛｝）做 base name 分組
- 同一個 base name 裡，挑最新課程規則（優先順序）：
    1. 年份 DESC（從欄位或課名擷取）
    2. 季別/期別權重 DESC（冬=4 > 秋=3 > 夏=2 > 春=1；T1/T2 → 數字）
    3. start_date DESC
    4. course_id DESC
- 使用者互動彙總規則：
    * action_* 欄位：SUM
    * unique_session_count：COUNT DISTINCT session_id（重新計）
    * avg_nActions_per_session：總 action 數 ÷ unique_session_count（重新計）
    * time_difference：SUM（輸出 total_time_difference）
    * truth：MAX (0/1)
    * timestamp：first_seen_at = MIN，last_seen_at = MAX
- 內建統計輸出與（可選）verify 守恆檢查
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

# ---------- 小工具 ----------
def find_col(df, candidates, required=False, default=None):
    cols_lower = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in cols_lower:
            return cols_lower[cand.lower()]
    if required:
        raise KeyError(f"Required column not found: {candidates} | existing: {list(df.columns)}")
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
    """從課名抓年份與期別權重：冬=4 > 秋=3 > 夏=2 > 春=1；T1/T2 取數字"""
    if pd.isna(name):
        return np.nan, np.nan
    s = str(name)
    years = YEAR_RE.findall(s)
    year = int(years[-1]) if years else np.nan
    term_w = np.nan
    m = re.search(r'[Tt]\s*[_\-]?\s*(\d+)', s)  # T1/T2
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

# ---------- 建立映射（舊 → 新） ----------
def build_mapping(df_course):
    course_id_col = find_col(df_course, ['course_id','id'], required=True)
    course_name_col = find_col(df_course, ['course_name','name','title','normalized_name'], required=True)
    year_col = find_col(df_course, ['year','course_year'], required=False)
    start_date_col = find_col(df_course, ['start_date','start','begin_date','course_start'], required=False)

    df = df_course.copy()
    df['_base_name'] = df[course_name_col].map(base_course_name)

    if year_col is None:
        df['_year'] = pd.to_numeric(df[course_name_col].map(lambda x: extract_year_and_term(x)[0]), errors='coerce')
        year_col_eff = '_year'
    else:
        df[year_col] = coerce_numeric(df[year_col], default=np.nan)
        year_col_eff = year_col

    df['_term_w'] = pd.to_numeric(df[course_name_col].map(lambda x: extract_year_and_term(x)[1]), errors='coerce')

    if start_date_col is not None:
        df['_start'] = to_datetime_safe(df[start_date_col])
        start_col_eff = '_start'
    else:
        start_col_eff = None

    sort_by = [year_col_eff, '_term_w']
    ascending = [False, False]
    if start_col_eff:
        sort_by.append(start_col_eff); ascending.append(False)
    sort_by.append(course_id_col); ascending.append(False)

    df_sorted = df.sort_values(sort_by, ascending=ascending, kind='mergesort')
    winners = df_sorted.drop_duplicates(subset=['_base_name'], keep='first') \
                       [['_base_name', course_id_col]].rename(columns={course_id_col:'to_course_id'})

    mapping = df.merge(winners, on='_base_name', how='left') \
                .rename(columns={course_id_col:'from_course_id'})
    mapping = mapping[mapping['from_course_id'] != mapping['to_course_id']] \
                    [['from_course_id','to_course_id','_base_name']].drop_duplicates()

    return mapping

# ---------- 合併互動 ----------
def merge_interactions(df_ev, mapping):
    user_col = find_col(df_ev, ['username','user','user_name','uid'], required=True)
    course_ev_col = find_col(df_ev, ['course_id','cid'], required=True)
    session_col = find_col(df_ev, ['session_id','sessionId','sid'], required=False)
    truth_col = find_col(df_ev, ['truth','completed'], required=False)
    time_diff_col = find_col(df_ev, ['time_difference','duration','elapsed_seconds'], required=False)
    timestamp_col = find_col(df_ev, ['timestamp','ts','time'], required=False)

    action_cols = [c for c in df_ev.columns if c.lower().startswith('action_')]

    out = df_ev.copy()
    for c in action_cols:
        out[c] = coerce_numeric(out[c], 0)

    map_dict = dict(zip(mapping['from_course_id'], mapping['to_course_id'])) if not mapping.empty else {}
    out['_target_course_id'] = out[course_ev_col].map(lambda x: map_dict.get(x, x))

    if timestamp_col: out['_ts'] = to_datetime_safe(out[timestamp_col])
    if time_diff_col: out['_time_diff'] = coerce_numeric(out[time_diff_col], 0)
    if truth_col:
        def truthy(v):
            if pd.isna(v): return 0
            s = str(v).strip().lower()
            return 1 if s in {'1','true','yes','y','完成','done','passed','complete','completed'} else 0
        out['_truth'] = out[truth_col].map(truthy)

    # 去除完全重複列（避免同一次 session 被算兩次）
    dup_keys = [user_col, '_target_course_id'] + action_cols
    if session_col: dup_keys.append(session_col)
    if timestamp_col: dup_keys.append('_ts')
    if time_diff_col: dup_keys.append('_time_diff')
    if truth_col: dup_keys.append('_truth')
    out = out.drop_duplicates(subset=dup_keys)

    # 聚合
    g = out.groupby([user_col, '_target_course_id'], dropna=False)
    summed = g[action_cols].sum().reset_index()

    if session_col:
        uniq = g[session_col].nunique().rename('unique_session_count').reset_index()
    else:
        uniq = summed[[user_col,'_target_course_id']].assign(unique_session_count=1)

    if time_diff_col:
        total_time = g['_time_diff'].sum().rename('total_time_difference').reset_index()
    else:
        total_time = summed[[user_col,'_target_course_id']].assign(total_time_difference=0)

    if timestamp_col:
        first_seen = g['_ts'].min().rename('first_seen_at').reset_index()
        last_seen  = g['_ts'].max().rename('last_seen_at').reset_index()
    else:
        first_seen = summed[[user_col,'_target_course_id']].assign(first_seen_at=pd.NaT)
        last_seen  = summed[[user_col,'_target_course_id']].assign(last_seen_at=pd.NaT)

    if truth_col:
        truth_max = g['_truth'].max().rename('truth').reset_index()
    else:
        truth_max = summed[[user_col,'_target_course_id']].assign(truth=np.nan)

    merged = (summed
              .merge(uniq, on=[user_col,'_target_course_id'])
              .merge(total_time, on=[user_col,'_target_course_id'])
              .merge(first_seen, on=[user_col,'_target_course_id'])
              .merge(last_seen, on=[user_col,'_target_course_id'])
              .merge(truth_max, on=[user_col,'_target_course_id'])
             )

    merged['total_actions'] = merged[[c for c in action_cols]].sum(axis=1)
    merged['avg_nActions_per_session'] = merged['total_actions'] / merged['unique_session_count'].replace(0, np.nan)
    merged = merged.rename(columns={'_target_course_id':'course_id'})

    return merged, action_cols, user_col

# ---------- 簡易 verify（守恆檢查 & 統計輸出） ----------
def quick_verify(df_raw, df_merged, mapping, action_cols_merged, user_col_merged, topn=10):
    # 把 RAW 做同樣映射與去重，僅比較 Σ action_*
    user_col = find_col(df_raw, ['username','user','user_name','uid'], required=True)
    course_col = find_col(df_raw, ['course_id','cid'], required=True)
    session_col = find_col(df_raw, ['session_id','sessionId','sid'], required=False)
    ts_col = find_col(df_raw, ['timestamp','ts','time'], required=False)

    action_cols = [c for c in df_raw.columns if c.lower().startswith('action_')]
    df = df_raw.copy()
    for c in action_cols: df[c] = coerce_numeric(df[c], 0)

    map_dict = dict(zip(mapping['from_course_id'], mapping['to_course_id'])) if not mapping.empty else {}
    df['_course'] = df[course_col].map(lambda x: map_dict.get(x, x))
    if ts_col is not None: df['_ts'] = to_datetime_safe(df[ts_col])

    dup_keys = [user_col, '_course'] + action_cols
    if session_col: dup_keys.append(session_col)
    if ts_col: dup_keys.append('_ts')
    df = df.drop_duplicates(subset=dup_keys)

    g = df.groupby([user_col, '_course'], dropna=False)
    raw_sum = g[action_cols].sum().reset_index()
    raw_sum['total_actions'] = raw_sum[action_cols].sum(axis=1)

    # per-course totals
    raw_per_course = raw_sum.groupby('_course', dropna=False)['total_actions'].sum()
    merged_per_course = df_merged.groupby('course_id', dropna=False)['total_actions'].sum()

    # global
    global_raw = float(raw_per_course.sum())
    global_new = float(merged_per_course.sum())
    global_delta = global_new - global_raw

    # deltas per course
    per_course = pd.concat([raw_per_course.rename('raw'), merged_per_course.rename('new')], axis=1).fillna(0)
    per_course['delta'] = per_course['new'] - per_course['raw']
    worst = per_course.reindex(per_course['delta'].abs().sort_values(ascending=False).head(topn).index)

    # users
    users_raw = set(df[user_col].unique())
    users_new = set(df_merged[user_col_merged].unique())

    print("\n==== Quick Stats / Verify ====")
    print(f"Users before (mapped+dedup): {len(users_raw)}")
    print(f"Users after  (merged)      : {len(users_new)}")
    print(f"Global total actions (raw) : {global_raw:.0f}")
    print(f"Global total actions (new) : {global_new:.0f}")
    print(f"Delta (new - raw)          : {global_delta:.0f}")
    if len(worst) > 0:
        print("\nTop course deltas (abs):")
        print(worst.head(topn).reset_index().rename(columns={'index':'course_id'}).to_string(index=False))

# ---------- 主程式 ----------
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--interactions", required=True, help="Path to interactions CSV")
    p.add_argument("--courses", required=False, default="course_info_with_embeddings.csv",
                   help="Path to course info CSV (default: course_info_with_embeddings.csv)")
    p.add_argument("--out_interactions", default="user_course_events_merged.csv")
    p.add_argument("--out_mapping", default="course_id_merge.csv")
    p.add_argument("--verify", action="store_true", help="Run quick conservation check and print stats")
    p.add_argument("--topn", type=int, default=10, help="Top-N per-course deltas to print when --verify")
    args = p.parse_args()

    # Load
    df_ev = pd.read_csv(args.interactions)
    df_course = pd.read_csv(args.courses)

    # Build mapping
    mapping = build_mapping(df_course)

    # Merge interactions
    merged, action_cols, user_col = merge_interactions(df_ev, mapping)

    # Save outputs
    Path(args.out_interactions).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out_mapping).parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(args.out_interactions, index=False, encoding='utf-8-sig')
    mapping.to_csv(args.out_mapping, index=False, encoding='utf-8-sig')

    # ---- 主控台統計輸出 ----
    print("==== Merge Done ====")
    print(f"輸出互動檔: {args.out_interactions}")
    print(f"輸出映射檔: {args.out_mapping}")
    print(f"合併後課程數: {merged['course_id'].nunique()}")
    print(f"用戶數: {merged[user_col].nunique()}")
    print(f"Σ action_*（全表）: {int(merged[action_cols].sum().sum())}")
    # 每課互動總量 TOP-N（快速觀察）
    per_course_total = merged.groupby('course_id', dropna=False)['total_actions'].sum().sort_values(ascending=False).head(args.topn)
    print("\n每課 total_actions TOP-{}:".format(args.topn))
    print(per_course_total.to_string())

    # 映射範例（前幾條）
    if not mapping.empty:
        print("\n映射樣本（from → to；base_name）:")
        print(mapping.head(args.topn).to_string(index=False))
    else:
        print("\n（沒有可映射的舊 id，所有課本來就唯一）")

    # ---- 可選 verify 守恆檢查 ----
    if args.verify:
        quick_verify(df_ev, merged, mapping, action_cols, user_col, topn=args.topn)

if __name__ == "__main__":
    main()
