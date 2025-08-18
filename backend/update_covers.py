import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

# 依你的檔名與分類對應
COVER_BY_CATEGORY = {
    '語言': 'images/語言人文.jpg',
    '音樂': 'images/音樂美學.jpg',
    '攝影': 'images/影像創作.jpg',
    '藝術': 'images/藝術設計.jpg',
    '程式': 'images/資訊工程.jpg',
    '科學': 'images/數理科學.jpg',
    '商管': 'images/商業管理.jpg',
    '教育': 'images/教育學習.jpg',
    '生活': 'images/生活應用.jpg',
    '運動': 'images/運動健康.jpg',
}
DEFAULT_PATH = 'images/default_course.png'

TABLE = 'courses'          # 如果表名不同，改這裡
CATEGORY_COL = 'category'  # 如果分類欄位不同，改這裡

def main():
    conn = pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        charset='utf8mb4',
        autocommit=False,
    )
    cur = conn.cursor()

    try:
        # 1) 備份欄位（若不存在）
        cur.execute(f"SHOW COLUMNS FROM `{TABLE}` LIKE 'image_path_bak'")
        if cur.fetchone() is None:
            cur.execute(f"ALTER TABLE `{TABLE}` ADD COLUMN `image_path_bak` VARCHAR(255)")
            cur.execute(f"UPDATE `{TABLE}` SET image_path_bak = image_path")

        # 2) 取出目前 still default 的課程
        cur.execute(
            f"SELECT id, `{CATEGORY_COL}` FROM `{TABLE}` WHERE image_path=%s",
            (DEFAULT_PATH,)
        )
        rows = cur.fetchall()
        print(f"找到仍為 default 的筆數：{len(rows)}")

        # 3) 組更新清單（只有對得到封面的才更新）
        updates = []
        for cid, cat in rows:
            cat = (cat or '').strip()
            new_path = COVER_BY_CATEGORY.get(cat)
            if new_path:
                updates.append((new_path, cid))

        print(f"可替換為分類封面的筆數：{len(updates)}")

        # 4) 進行更新（僅更新仍為 default 者）
        if updates:
            cur.executemany(
                f"UPDATE `{TABLE}` SET image_path=%s WHERE id=%s AND image_path=%s",
                [(p, i, DEFAULT_PATH) for p, i in updates]
            )

        # 5) 提交
        conn.commit()
        print("✅ 已提交（COMMIT）")

        # 6) 驗證剩餘 default 筆數
        cur.execute(
            f"SELECT COUNT(*) FROM `{TABLE}` WHERE image_path=%s",
            (DEFAULT_PATH,)
        )
        remaining = cur.fetchone()[0]
        print(f"目前仍為 default 的筆數：{remaining}")

    except Exception as e:
        conn.rollback()
        print("❌ 發生錯誤，已回滾：", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
