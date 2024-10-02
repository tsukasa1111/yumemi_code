時間がないので1ファイルに書きましたが実際はこのような構成にする予定でした．

### ファイル構成

1. `components/PrefectureSelector.tsx`: 都道府県選択コンポーネント
2. `components/PopulationGraph.tsx`: 人口グラフコンポーネント
3. `components/CategorySelector.tsx`: 人口区分選択コンポーネント
4. `utils/api.ts`: API呼び出し関連の関数（都道府県データと人口データの取得）
5. `utils/types.ts`: 型定義（`Prefecture`, `PopulationCategory`, `PopulationData` など）
6. `pages/index.tsx`: メインのページコンポーネント（`Index`）

### ディレクトリ構成例

```
your-project/
├── components/
│   ├── CategorySelector.tsx
│   ├── PopulationGraph.tsx
│   ├── PrefectureSelector.tsx
├── utils/
│   ├── api.ts
│   ├── types.ts
├── pages/
│   ├── index.tsx
└── ...
```

### 各ファイルの内容とコード

#### 1. `components/PrefectureSelector.tsx`

- **説明**: 都道府県を選択するためのコンポーネント。状態管理は`Index`で行い、ここでは見た目や選択操作のみを扱う。

```tsx
import React from 'react'
import { Prefecture } from '../utils/types'

const PrefectureSelector: React.FC<{
  prefectures: Prefecture[]
  onChange: (prefCode: number, isChecked: boolean) => void
  selectedPrefectures: number[]
}> = ({ prefectures, onChange, selectedPrefectures }) => {
  const handleSelectAll = () => {
    prefectures.forEach((pref) => onChange(pref.prefCode, true))
  }

  const handleClearAll = () => {
    selectedPrefectures.forEach((code) => onChange(code, false))
  }

  return (
    <div className="prefecture-selector">
      <h2 className="text-2xl font-bold mb-4">都道府県を選択</h2>
      <div className="mb-4 flex space-x-4">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleSelectAll}
        >
          全選択
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleClearAll}
        >
          全解除
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {prefectures.map((pref) => (
          <label key={pref.prefCode} className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600"
              checked={selectedPrefectures.includes(pref.prefCode)}
              onChange={() => onChange(pref.prefCode, !selectedPrefectures.includes(pref.prefCode))}
            />
            <span className="ml-2 text-sm">{pref.prefName}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default PrefectureSelector
```

#### 2. `components/PopulationGraph.tsx`

- **説明**: 選択された都道府県の人口データを表示するグラフコンポーネント。

```tsx
import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { PopulationData, PopulationCategory } from '../utils/types'

const PopulationGraph: React.FC<{
  data: PopulationData
  selectedPrefectures: number[]
  category: PopulationCategory
}> = ({ data, selectedPrefectures, category }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#0EA5E9']

  const selectedData = selectedPrefectures.map((prefCode) => data[prefCode]).filter(Boolean)

  const formattedData = selectedData.length
    ? selectedData[0].data.map((yearData, index) => ({
        year: yearData.year,
        ...Object.fromEntries(
          selectedData.map((prefData) => [prefData.prefName, prefData.data[index]?.value])
        )
      }))
    : []

  return (
    <div className="graph-container mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">{category}の人口推移グラフ</h2>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} />
          <YAxis domain={[0, 'dataMax']} />
          <Tooltip />
          <Legend />
          {selectedData.map((prefData, index) => (
            <Line key={prefData.prefName} type="monotone" dataKey={prefData.prefName} stroke={colors[index % colors.length]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PopulationGraph
```

#### 3. `components/CategorySelector.tsx`

- **説明**: 表示する人口区分を選択するためのコンポーネント。

```tsx
import React from 'react'
import { PopulationCategory } from '../utils/types'

const CategorySelector: React.FC<{
  category: PopulationCategory
  onChange: (category: PopulationCategory) => void
}> = ({ category, onChange }) => {
  const categories: PopulationCategory[] = ['総人口', '年少人口', '生産年齢人口', '老年人口']

  return (
    <div className="category-selector mt-6">
      <h2 className="text-2xl font-bold mb-4">表示する人口区分を選択</h2>
      <div className="flex flex-wrap gap-4 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full ${category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategorySelector
```

#### 4. `utils/api.ts`

- **説明**: API呼び出しのロジックをまとめるファイル。

```tsx
import axios from 'axios'
import { Prefecture } from './types'

const API_ENDPOINT = 'https://opendata.resas-portal.go.jp/api/v1'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

export const fetchPrefectures = async (): Promise<Prefecture[]> => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/prefectures`, {
      headers: { 'X-API-KEY': API_KEY }
    })
    return response.data.result
  } catch (error) {
    console.error('Error fetching prefectures:', error)
    return []
  }
}
```

#### 5. `utils/types.ts`

- **説明**: アプリ全体で使う型定義をまとめるファイル。

```tsx
export type Prefecture = {
  prefCode: number
  prefName: string
}

export type PopulationCategory = '総人口' | '年少人口' | '生産年齢人口' | '老年人口'

export type PopulationData = {
  [prefCode: number]: {
    prefName: string
    data: {
      year: number
      value: number
    }[]
    categoryIndex: number
  }
}
```

#### 6. `pages/index.tsx`

- **説明**: メインのページコンポーネント。ここでコンポーネントを組み合わせてアプリケーションを作成する。

```tsx
import React, { useState, useEffect } from 'react'
import PrefectureSelector from '../components/PrefectureSelector'
import PopulationGraph from '../components/PopulationGraph'
import CategorySelector from '../components/CategorySelector'
import { fetchPrefectures } from '../utils/api'
import { Prefecture, PopulationCategory, PopulationData } from '../utils/types'

const Index: React.FC = () => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  // ... (残りは以前のコードと同じ)
}

export default Index
```

gitのメッセージも理解しています．

1. **`feat:`** - 新機能の追加  
   - 例: `feat: 都道府県選択コンポーネントを追加`
  
2. **`fix:`** - バグ修正  
   - 例: `fix: 非選択時の人口データ取得のバグを修正`
  
3. **`docs:`** - ドキュメントのみの変更  
   - 例: `docs: READMEに環境変数の設定手順を追加`
  
4. **`style:`** - コードの動作に影響を与えない変更（空白、フォーマット、セミコロンの欠落など）  
   - 例: `style: インデントを2スペースに変更`
  
5. **`refactor:`** - バグの修正や機能の追加ではないコードのリファクタリング  
   - 例: `refactor: API呼び出しロジックを分離`
  
6. **`perf:`** - パフォーマンス改善に関する変更  
   - 例: `perf: グラフ描画のレンダリングを最適化`
  
7. **`test:`** - テストの追加や既存テストの修正  
   - 例: `test: 都道府県データ取得関数のユニットテストを追加`
  
8. **`chore:`** - ビルドプロセスやドキュメント生成など、ソースコードやテストに影響を与えない変更  
   - 例: `chore: パッケージの依存関係を更新`
  
9. **`build:`** - ビルドシステムや外部依存に関する変更（例: `npm`, `yarn`, `webpack`）  
   - 例: `build: 新しいプラグインを追加`
  
10. **`ci:`** - 継続的インテグレーションの設定やスクリプトの変更  
    - 例: `ci: GitHub Actionsのワークフローを修正`
  
11. **`revert:`** - 以前のコミットを取り消す  
    - 例: `revert: feat: 都道府県選択コンポーネントを追加`

12. **`add:`** - ファイルやモジュールの追加に使用（`feat:`に含めることもある）  
    - 例: `add: utilsフォルダに新しいAPI関数を追加`

