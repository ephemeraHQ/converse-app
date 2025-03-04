export class TrieNode<T> {
  children: Map<string, TrieNode<T>>
  isEndOfWord: boolean
  value: T | null

  constructor() {
    this.children = new Map()
    this.isEndOfWord = false
    this.value = null
  }
}

export class Trie<T> {
  private root: TrieNode<T>

  constructor() {
    this.root = new TrieNode<T>()
  }

  insert(word: string, value: T): void {
    let current = this.root

    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode<T>())
      }
      current = current.children.get(char)!
    }

    current.isEndOfWord = true
    current.value = value
  }

  search(rawWord: string): T | null {
    const word = rawWord.toLowerCase().trim()
    let current = this.root

    for (const char of word) {
      if (!current.children.has(char)) {
        return null
      }
      current = current.children.get(char)!
    }

    return current.isEndOfWord ? current.value : null
  }

  startsWith(prefix: string): boolean {
    let current = this.root

    for (const char of prefix) {
      if (!current.children.has(char)) {
        return false
      }
      current = current.children.get(char)!
    }

    return true
  }

  findAllWithPrefix(rawPrefix: string): T[] {
    const prefix = rawPrefix.toLowerCase().trim()
    const results: T[] = []
    let current = this.root

    // Navigate to the node representing the prefix
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return results
      }
      current = current.children.get(char)!
    }

    // Collect all values under this node
    this.collectValues(current, results)
    return results
  }

  private collectValues(node: TrieNode<T>, results: T[]): void {
    if (node.isEndOfWord && node.value !== null) {
      results.push(node.value)
    }

    for (const child of node.children.values()) {
      this.collectValues(child, results)
    }
  }

  delete(word: string): boolean {
    return this.deleteRecursive(this.root, word, 0)
  }

  private deleteRecursive(current: TrieNode<T>, word: string, index: number): boolean {
    if (index === word.length) {
      if (!current.isEndOfWord) {
        return false
      }
      current.isEndOfWord = false
      current.value = null
      return current.children.size === 0
    }

    const char = word[index]
    if (!current.children.has(char)) {
      return false
    }

    const shouldDeleteChild = this.deleteRecursive(current.children.get(char)!, word, index + 1)

    if (shouldDeleteChild) {
      current.children.delete(char)
      return current.children.size === 0 && !current.isEndOfWord
    }

    return false
  }
}
