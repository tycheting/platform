import pandas as pd

ACTION_CSV = "user_action.csv"   # user_id
USERS_CSV  = "users.csv"    # id, username
COURSES_CSV = "courses.csv"
OUT_CSV    = "action_transfromed.csv"

# 讀檔
action = pd.read_csv(ACTION_CSV, dtype=str)
users  = pd.read_csv(USERS_CSV, dtype=str)[["userid", "username"]].drop_duplicates("userid")
courses  = pd.read_csv(COURSES_CSV, dtype=str)[["courseid", "coursename"]].drop_duplicates("courseid")

# 把 user_id 映射成 username
u_mapping = dict(zip(users["userid"], users["username"]))
c_mapping = dict(zip(courses["courseid"], courses["coursename"]))
action["username"] = action["username"].map(u_mapping).fillna(action["username"])
action["course_id"] = action["course_id"].map(c_mapping).fillna(action["course_id"])

# 輸出（用 utf-8-sig 方便 Excel 開）
action.to_csv(OUT_CSV, index=False, encoding="utf-8")
print(f"{OUT_CSV}")
