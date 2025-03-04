import { areSetsEqual } from "./set" // Replace with the actual file path

describe("areSetsEqual", () => {
  test("returns true for two empty sets", () => {
    const setA = new Set()
    const setB = new Set()
    expect(areSetsEqual(setA, setB)).toBe(true)
  })

  test("returns true for sets with the same elements", () => {
    const setA = new Set([1, 2, 3])
    const setB = new Set([3, 2, 1])
    expect(areSetsEqual(setA, setB)).toBe(true)
  })

  test("returns false for sets with different elements", () => {
    const setA = new Set([1, 2, 3])
    const setB = new Set([4, 5, 6])
    expect(areSetsEqual(setA, setB)).toBe(false)
  })

  test("returns false for sets of different sizes", () => {
    const setA = new Set([1, 2])
    const setB = new Set([1, 2, 3])
    expect(areSetsEqual(setA, setB)).toBe(false)
  })

  test("returns false for sets with the same size but different elements", () => {
    const setA = new Set([1, 2, 3])
    const setB = new Set([1, 2, 4])
    expect(areSetsEqual(setA, setB)).toBe(false)
  })

  test("returns true for sets with the same elements of different types", () => {
    const setA = new Set(["1", "2", "3"])
    const setB = new Set(["3", "2", "1"])
    expect(areSetsEqual(setA, setB)).toBe(true)
  })

  test("returns true for sets with complex elements", () => {
    const obj1 = { key: "value" }
    const obj2 = { key: "value" }
    const setA = new Set([obj1])
    const setB = new Set([obj1])
    const setC = new Set([obj2]) // Different reference
    expect(areSetsEqual(setA, setB)).toBe(true)
    expect(areSetsEqual(setA, setC)).toBe(false)
  })
})
