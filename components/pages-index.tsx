// App.tsx

'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// 型定義
type Prefecture = {
  prefCode: number
  prefName: string
}

type PopulationCategory = '総人口' | '年少人口' | '生産年齢人口' | '老年人口'

type PopulationData = {
  [prefCode: number]: {
    prefName: string
    data: {
      year: number
      value: number
    }[]
    categoryIndex: number
  }
}

// API関数
const API_ENDPOINT = 'https://opendata.resas-portal.go.jp/api/v1'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY // 必ずご自身のAPIキーに置き換えてください

const fetchPrefectures = async (): Promise<Prefecture[]> => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/prefectures`, {
      headers: { 'X-API-KEY': API_KEY }
    })
    const prefs: Prefecture[] = response.data.result
    return prefs
  } catch (error) {
    console.error('Error fetching prefectures:', error)
    return []
  }
}

const fetchPopulationByCategory = async (
  prefCode: number,
  prefName: string,
  categoryIndex: number
): Promise<{
  prefName: string
  data: {
    year: number
    value: number
  }[]
} | null> => {
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/population/composition/perYear`,
      {
        headers: { 'X-API-KEY': API_KEY },
        params: { prefCode, cityCode: '-' }
      }
    )
    return {
      prefName: prefName,
      data: response.data.result.data[categoryIndex].data
    }
  } catch (error) {
    console.error(`Error fetching population data for prefecture ${prefCode}:`, error)
    return null
  }
}

// PrefectureSelector コンポーネント
const PrefectureSelector: React.FC<{
  prefectures: Prefecture[]
  onChange: (prefCode: number, isChecked: boolean) => void
  selectedPrefectures: number[]
}> = ({
  prefectures,
  onChange,
  selectedPrefectures
}) => {
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
          <label
            key={pref.prefCode}
            className="inline-flex items-center cursor-pointer"
          >
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-indigo-600"
              checked={selectedPrefectures.includes(pref.prefCode)}
              onChange={() =>
                onChange(pref.prefCode, !selectedPrefectures.includes(pref.prefCode))
              }
            />
            <span className="ml-2 text-sm">{pref.prefName}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// PopulationGraph コンポーネント
const PopulationGraph: React.FC<{
  data: PopulationData
  selectedPrefectures: number[]
  category: PopulationCategory
}> = ({ data, selectedPrefectures, category }) => {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#6366F1',
    '#14B8A6',
    '#F97316',
    '#0EA5E9',
    '#A3E635',
    '#D946EF',
    '#2DD4BF',
    '#F472B6',
    '#FACC15',
    '#4ADE80',
    '#22D3EE',
  ]

  const selectedData = selectedPrefectures
    .map((prefCode) => data[prefCode])
    .filter(Boolean)

  const formattedData = selectedData.length
    ? selectedData[0].data.map((yearData, index) => ({
        year: yearData.year,
        ...Object.fromEntries(
          selectedData.map((prefData) => [
            prefData.prefName,
            prefData.data[index]?.value
          ])
        )
      }))
    : []

  return (
    <div className="graph-container mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">{category}の人口推移グラフ</h2>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString()}人`}
                labelFormatter={(label) => `${label}年`}
              />
              <Legend />
              {selectedData.map((prefData, index) => (
                <Line
                  key={prefData.prefName}
                  type="monotone"
                  dataKey={prefData.prefName}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// CategorySelector コンポーネント
const CategorySelector: React.FC<{
  category: PopulationCategory
  onChange: (category: PopulationCategory) => void
}> = ({ category, onChange }) => {
  const categories: PopulationCategory[] = [
    '総人口',
    '年少人口',
    '生産年齢人口',
    '老年人口'
  ]

  return (
    <div className="category-selector mt-6">
      <h2 className="text-2xl font-bold mb-4">表示する人口区分を選択</h2>
      <div className="flex flex-wrap gap-4 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              category === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

// Index コンポーネント
const Index: React.FC = () => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  const [selectedPrefectures, setSelectedPrefectures] = useState<number[]>([])
  const [populationData, setPopulationData] = useState<PopulationData>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [category, setCategory] = useState<PopulationCategory>('総人口')

  useEffect(() => {
    fetchPrefectures().then(setPrefectures)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const data: PopulationData = { ...populationData }
      const categoryIndex = getCategoryIndex(category)

      for (const prefCode of selectedPrefectures) {
        // 既にデータがキャッシュされていない場合のみ取得
        if (
          !data[prefCode] ||
          data[prefCode].categoryIndex !== categoryIndex
        ) {
          const pref = prefectures.find(p => p.prefCode === prefCode)
          if (!pref) continue
          const result = await fetchPopulationByCategory(prefCode, pref.prefName, categoryIndex)
          if (result) {
            data[prefCode] = { ...result, categoryIndex }
          }
          // 1秒に1リクエストのレートリミットを守るために待機
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
      setPopulationData(data)
      setIsLoading(false)
    }
    if (selectedPrefectures.length > 0) {
      fetchData()
    }
  }, [selectedPrefectures, category, prefectures])

  const handlePrefectureChange = (prefCode: number, isChecked: boolean) => {
    setSelectedPrefectures((prev) =>
      isChecked ? [...prev, prefCode] : prev.filter((code) => code !== prefCode)
    )
  }

  const handleCategoryChange = (newCategory: PopulationCategory) => {
    setCategory(newCategory)
    // 選択されている都道府県のデータを再取得するため、populationDataをクリア
    setPopulationData({})
  }

  const getCategoryIndex = (category: PopulationCategory): number => {
    switch (category) {
      case '総人口':
        return 0
      case '年少人口':
        return 1
      case '生産年齢人口':
        return 2
      case '老年人口':
        return 3
      default:
        return 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-8">
          都道府県別人口推移グラフ
        </h1>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <PrefectureSelector
              prefectures={prefectures}
              onChange={handlePrefectureChange}
              selectedPrefectures={selectedPrefectures}
            />

            <CategorySelector category={category} onChange={handleCategoryChange} />

            {isLoading ? (
              <div className="text-center mt-6">
                <span className="text-lg font-medium">データを取得中...</span>
                {/* プログレスバーを追加 */}
                <div className="mt-4 w-1/2 mx-auto bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${(Object.keys(populationData).length / selectedPrefectures.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : selectedPrefectures.length > 0 ? (
              <PopulationGraph
                data={populationData}
                selectedPrefectures={selectedPrefectures}
                category={category}
              />
            ) : (
              <div className="text-center mt-6">
                <span className="text-lg">都道府県を選択してください。</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index
