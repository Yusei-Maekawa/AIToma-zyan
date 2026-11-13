/**
 * 関係のある3枚（順子に相当）。
 * JSON にそのまま出せるデータだけを置く。説明文やアイコンは持たない。
 * エンジンはこの配列を引数で受け取り、このファイルを直接読まなくても動く。
 */
export interface RelationMeld {
  id: string
  tiles: readonly [string, string, string]
  /** なぜこの3枚が1組なのか。画面の解説に使う */
  reason: string
}

export const RELATIONS: readonly RelationMeld[] = [
  {
    id: 'python-fastapi-postgresql',
    tiles: ['python', 'fastapi', 'postgresql'],
    reason: 'Python の API から PostgreSQL に保存する、サーバー側の一組',
  },
  {
    id: 'react-fastapi-postgresql',
    tiles: ['react', 'fastapi', 'postgresql'],
    reason: '画面、API、データベースにつながる Web アプリの一組',
  },
  {
    id: 'python-llm-docker',
    tiles: ['python', 'llm', 'docker'],
    reason: 'Python で作った言語モデルを、Docker で同じ環境として動かす一組',
  },
]
