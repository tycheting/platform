###### **教材**
章節教材列表：GET /course/material/chapters/:chapterId

課程所有教材：GET /course/material/courses/:courseId

新增教材：POST /course/material/chapters/:chapterId
    body: { title, type: 'pdf'|'slides'|'link'|'code'|'image'|'file', url, position? }

刪除教材：DELETE /course/material/:materialId

整章節重排：POST /course/material/chapters/:chapterId/reorder
    body: { orderedIds: \[3,5,2,4,...] }

單筆移動：PATCH /course/material/:materialId/position
    body: { position: 2 }

受保護下載：GET /course/material/:materialId/download

之後要做角色權限（例如只有課程建立者/管理員可管理），我可以幫你把 canManage() 改成查 courses.instructor\_id 或 users.role 之類的欄位，並在 SQL 裡做比對。


###### **題目** 

GET /course/question/chapters/:chapterId：章節題目列表（options/answer 會轉回 JSON）

POST /course/question/:questionId/check：作答檢查
    （body: { userAnswer }；single=字串、multiple=陣列、true\_false=布林、short\_answer=字串）
    題目管理（需 JWT，預設任何登入者；可在程式改成教師/管理員）

POST /course/question/chapters/:chapterId：新增題目
    （body: { type, question, options?, answer?, explanation?, score?, position? }）

PATCH /course/question/:questionId：更新題目（部分欄位）

DELETE /course/question/:questionId：刪除題目（自動重排 position）

POST /course/question/chapters/:chapterId/reorder：整章節重排
    （body: { orderedIds: \[id1,id2,...] }）

PATCH /course/question/:questionId/position：單筆移動到指定位置
    （body: { position: N }）

###### **討論區**

GET /course/discussion/chapters/:chapterId
    功能：取得章節的討論串清單（支援搜尋、分頁、置頂排序）
    Query：
    page（預設 1）、size（預設 20，最大 50）
    q：關鍵字（同時搜尋 thread title/body 與貼文 body）
    回傳：threads\[] 每筆含 id/title/body/pinned/posts\_count/last\_reply\_at/...
新增串：POST /course/discussion/chapters/:chapterId
    功能：新增討論串（需已選課）
    Body：{ title: string, body?: string }
    備註：自動初始化 posts\_count=0、last\_reply\_at=NOW()
PATCH /course/discussion/:discussionId
    功能：更新討論串（作者或管理者）
    Body：{ title?, body?, pinned? }
PATCH /course/discussion/:discussionId/pin
    功能：置頂/取消置頂（預設作者可，建議改限管理者）
    Body：{ pinned: boolean }
DELETE /course/discussion/:discussionId
    功能：刪除討論串（作者或管理者）
    備註：同時刪除其所有貼文
GET /course/discussion/:discussionId/posts
    功能：取得單一討論串的貼文清單
    Query：page（預設 1）、size（預設 20，最大 100）
    回傳：依時間正序（含巢狀回覆 parent\_id，前端自行組樹）
POST /course/discussion/:discussionId/posts
    功能：在討論串新增貼文 / 回覆（需已選課）
    Body：{ body: string, parent\_id?: number }
    備註：自動 posts\_count +1、更新 last\_reply\_at
PATCH /course/discussion/posts/:postId
    功能：更新貼文內容（作者或管理者）
    Body：{ body: string }
DELETE /course/discussion/posts/:postId
    功能：刪除貼文（作者或管理者）
    備註：會先刪其直接子回覆，並重算該討論串的 posts\_count / last\_reply\_at

###### **留言區**

GET /course/comment/chapters/:chapterId?page=1\&size=20 取得章節留言（需 JWT、需已選課）

POST /course/comment/chapters/:chapterId 新增留言（需 JWT、需已選課） body:{ body }

PATCH /course/comment/:commentId 更新留言（需 JWT、作者/管理者） body:{ body }

DELETE /course/comment/:commentId 刪除留言（需 JWT、作者/管理者）
