/**
 * 数组相关工具函数
 */

// 数组去重
export function noRepeat<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// 查找数组最大值
export function arrayMax(arr: number[]): number {
  if (!arr.length) throw new Error('Array is empty')
  return Math.max(...arr)
}

// 查找数组最小值
export function arrayMin(arr: number[]): number {
  if (!arr.length) throw new Error('Array is empty')
  return Math.min(...arr)
}

// 数组分割
export function chunk<T>(arr: T[], size: number = 1): T[][] {
  if (size <= 0) return [arr.slice()]
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

// 检查元素出现次数
export function countOccurrences<T>(arr: T[], value: T): number {
  return arr.reduce((count, current) => (current === value ? count + 1 : count), 0)
}

// 扁平化数组
export function flatten<T>(arr: any[], depth: number = Infinity): T[] {
  return arr.flat(depth)
}

// 返回两个数组的差集
export function difference<T>(arrA: T[], arrB: T[]): T[] {
  const setB = new Set(arrB)
  return arrA.filter((item) => !setB.has(item))
}

// 返回两个数组的交集
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2)
  return arr1.filter((item) => set2.has(item))
}

// 从右删除 n 个元素
export function dropRight<T>(arr: T[], n: number = 0): T[] {
  return arr.slice(0, Math.max(0, arr.length - n))
}

// 返回间隔 nth 的元素
export function everyNth<T>(arr: T[], nth: number): T[] {
  if (nth <= 0) return []
  return arr.filter((_, i) => i % nth === nth - 1)
}

// 返回第 n 个元素
export function nthElement<T>(arr: T[], n: number = 0): T | undefined {
  const index = n >= 0 ? n : arr.length + n
  return arr[index]
}

// 数组乱序
export function shuffle<T>(arr: T[]): T[] {
  const array = [...arr] // 创建新数组避免修改原数组
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// 统一处理可能为字符串或对象数组的数据，确保返回对象数组
export function normalizeSearchData<T extends Record<string, any>>(data: string | T[] | T): T[] {
  // 如果是字符串，尝试解析为JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return normalizeSearchData(parsed)
    } catch (e) {
      console.error('Failed to parse search data:', e)
      return []
    }
  }

  // 如果是数组，处理每个元素
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') {
        try {
          return JSON.parse(item)
        } catch (e) {
          console.error('Failed to parse search result item:', e)
          return {} as T
        }
      }
      return item as T
    })
  }

  // 如果是单个对象，放入数组中
  if (typeof data === 'object' && data !== null) {
    return [data as T]
  }

  // 其他情况返回空数组
  console.warn('Data is not a valid string, array, or object, converting to empty array')
  return []
}
