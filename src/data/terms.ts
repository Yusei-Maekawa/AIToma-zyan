import type { ITTerm } from '../types/mahjong'

/**
 * IT用語辞書（PoC: 9語）。
 *
 * 拡張方針:
 * - 200語程度まではこのファイル（またはカテゴリ別ファイル）に追記でよい。
 * - 約1,000語規模になったら JSON に切り出し、カテゴリ単位で動的 import する想定。
 *   参照は必ず getTerm() / findTermByName() 経由にしておき、保存形式を変えても呼び出し側を変えずに済むようにする。
 */
export const TERMS: readonly ITTerm[] = [
  {
    id: 'python',
    name: 'Python',
    reading: 'パイソン',
    primaryCategory: 'language',
    categories: ['language', 'ai', 'backend'],
    description:
      '読みやすく書きやすい文法が特徴のプログラミング言語。初心者の学習用から、AI・データ分析、Webサーバー、日々の作業の自動化まで幅広く使われている。',
    examples: [
      '機械学習モデルの学習（PyTorch・scikit-learn など）',
      'Excel・CSVの集計を自動化するスクリプト',
      'FastAPI・Django で作る Web サーバー',
    ],
    related: ['FastAPI', 'LLM', 'Docker', 'Git'],
    icon: { id: 'code-coil', meaning: 'コードの波括弧と、とぐろを巻く線（スクリプト言語）' },
  },
  {
    id: 'react',
    name: 'React',
    reading: 'リアクト',
    primaryCategory: 'frontend',
    categories: ['frontend'],
    description:
      'Webページの画面（UI: User Interface）を「コンポーネント」という部品の組み合わせで作る JavaScript ライブラリ。データが変わると、画面の必要な部分だけを効率よく更新する。',
    examples: [
      'SNSのタイムラインや「いいね」ボタン',
      '管理画面・ダッシュボード',
      'React Three Fiber による3D表示（このゲーム自体）',
    ],
    related: ['TypeScript', 'JavaScript', 'Vite', 'FastAPI'],
    icon: { id: 'component-tree', meaning: '親子に組み合わさるコンポーネントのツリー' },
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    reading: 'ファストAPI（API: Application Programming Interface）',
    primaryCategory: 'backend',
    categories: ['backend'],
    description:
      'Python で Web API を素早く作るためのフレームワーク。型ヒントを使って入力データのチェックを自動で行い、APIの説明書（OpenAPIドキュメント）も自動生成してくれる。',
    examples: [
      'スマホアプリ向けの REST API',
      '機械学習モデルを呼び出す推論 API',
      '社内ツールのバックエンド',
    ],
    related: ['Python', 'PostgreSQL', 'Docker', 'REST API'],
    icon: { id: 'api-exchange', meaning: 'リクエストとレスポンスが行き交う矢印' },
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    reading: 'ポストグレスキューエル（SQL: Structured Query Language）',
    tileLines: ['Postgre', 'SQL'],
    primaryCategory: 'database',
    categories: ['database', 'backend'],
    description:
      'オープンソースのリレーショナルデータベース（RDB）。データを表（テーブル）で管理し、SQL という言語で検索・更新する。信頼性が高く、JSON なども扱える。',
    examples: [
      'ECサイトの会員・注文データの保存',
      '業務システムのデータ管理',
      'pgvector 拡張による AI 向けのベクトル検索',
    ],
    related: ['FastAPI', 'Docker', 'SQL', 'MySQL'],
    icon: { id: 'database', meaning: 'データを積み重ねて保存する円柱' },
  },
  {
    id: 'tcp',
    name: 'TCP',
    reading: 'ティーシーピー（Transmission Control Protocol）',
    primaryCategory: 'network',
    categories: ['network'],
    description:
      'インターネット通信の基本ルール（プロトコル）の一つ。通信を始める前に「3ウェイハンドシェイク」で接続を確立し、データが順番どおり・欠けずに届くことを保証する。',
    examples: [
      'Webページの閲覧（HTTP/1.1・HTTP/2 の土台）',
      'メールの送信（SMTP）',
      'SSH によるサーバーへのリモート接続',
    ],
    related: ['IP', 'UDP', 'HTTP', 'AES'],
    icon: { id: 'handshake', meaning: '3ウェイハンドシェイク（SYN → SYN/ACK → ACK）のシーケンス図' },
  },
  {
    id: 'aes',
    name: 'AES',
    reading: 'エーイーエス（Advanced Encryption Standard）',
    primaryCategory: 'security',
    categories: ['security'],
    description:
      '世界中で標準的に使われている「共通鍵暗号」の方式。暗号化と復号に同じ鍵を使い、高速で安全性が高い。2001年に米国の標準規格（FIPS 197）として制定された。',
    examples: [
      'HTTPS（TLS）通信の暗号化',
      'Wi-Fi（WPA2・WPA3）の通信の暗号化',
      'スマホ・PCのストレージ暗号化',
    ],
    related: ['TLS', 'RSA', 'TCP', 'ハッシュ関数'],
    icon: { id: 'padlock', meaning: '鍵のかかった錠前（暗号化）' },
  },
  {
    id: 'docker',
    name: 'Docker',
    reading: 'ドッカー',
    primaryCategory: 'infra',
    categories: ['infra', 'devtools'],
    description:
      'アプリと、その動作に必要なライブラリや設定を「コンテナ」という箱にまとめて動かすツール。どのPCやサーバーでも同じ環境を再現でき、「自分のPCでは動いたのに」問題を減らせる。',
    examples: [
      'チーム全員で同じ DB・サーバー環境を用意する',
      'Web アプリをクラウドへデプロイする',
      'CI（自動テスト）の実行環境',
    ],
    related: ['Kubernetes', 'Linux', 'PostgreSQL', 'Git'],
    icon: { id: 'containers', meaning: '積み重なったコンテナ（箱）' },
  },
  {
    id: 'llm',
    name: 'LLM',
    reading: 'エルエルエム（Large Language Model：大規模言語モデル）',
    primaryCategory: 'ai',
    categories: ['ai'],
    description:
      '大量の文章データで学習した「大規模言語モデル」。次に来る言葉を予測する仕組みで、文章の生成・要約・翻訳・プログラミング支援などを行う。対話型AIアシスタントの中核技術。',
    examples: [
      'チャット形式の AI アシスタント',
      '長い文書の要約・翻訳',
      'コード補完やコードレビューの支援',
    ],
    related: ['Python', 'Transformer', 'RAG', '機械学習'],
    icon: { id: 'neural-net', meaning: '層状につながったニューラルネットワーク' },
  },
  {
    id: 'git',
    name: 'Git',
    reading: 'ギット',
    primaryCategory: 'devtools',
    categories: ['devtools'],
    description:
      'ファイルの変更履歴を記録・管理する「分散型バージョン管理システム」。いつ・誰が・何を変えたかを残し、ブランチで並行して開発した内容を後から統合（マージ）できる。',
    examples: [
      'チーム開発でのソースコード管理',
      'GitHub でのプルリクエストとコードレビュー',
      '不具合が入る前の状態に戻す',
    ],
    related: ['GitHub', 'Docker', 'CI/CD', 'Python'],
    icon: { id: 'branch-graph', meaning: '分岐して再び合流するブランチの履歴' },
  },
]

const termById = new Map<string, ITTerm>(TERMS.map((t) => [t.id, t]))
const termByName = new Map<string, ITTerm>(TERMS.map((t) => [t.name.toLowerCase(), t]))

/** IDから用語を取得（存在しないIDは開発時のバグなので例外にする） */
export function getTerm(id: string): ITTerm {
  const term = termById.get(id)
  if (!term) throw new Error(`Unknown term id: ${id}`)
  return term
}

/** 表示名から用語を検索（関連技術のリンク解決用）。辞書に無ければ undefined */
export function findTermByName(name: string): ITTerm | undefined {
  return termByName.get(name.toLowerCase())
}
