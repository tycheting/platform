import pandas as pd

# 讀取兩份資料
df_old = pd.read_csv("action_transfromed.csv")
df_new = pd.read_csv("Train_old.csv")

# 確保欄位一致
common_cols = list(set(df_old.columns) & set(df_new.columns))
df_old = df_old[common_cols]
df_new = df_new[common_cols]

# 合併兩筆資料
df_all = pd.concat([df_old, df_new])

# 將相同使用者 & 課程的行為次數加總
action_cols = [col for col in df_all.columns if col.startswith("action_")]
df_merged = df_all.groupby(["username", "course_id"], as_index=False)[action_cols].sum()

# 儲存新的合併檔案
df_merged.to_csv("Train.csv", index=False, encoding="utf-8")
print("合併完成")
