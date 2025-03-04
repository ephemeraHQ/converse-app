import { enitifyPages, entify, entifyWithAddress } from "./entify" // adjust the import path

describe("entify functions", () => {
  type Item = {
    id: string
    address: string
    name: string
  }

  const items: Item[] = [
    { id: "1", address: "address1", name: "Item 1" },
    { id: "2", address: "address2", name: "Item 2" },
    { id: "3", address: "address3", name: "Item 3" },
  ]

  describe("entify", () => {
    it("should transform an array of items into an EntityObject", () => {
      const result = entify(items, (item) => item.id)

      expect(result).toEqual({
        byId: {
          "1": items[0],
          "2": items[1],
          "3": items[2],
        },
        ids: ["1", "2", "3"],
      })
    })

    it("should handle an empty array", () => {
      const result = entify([], (item: any) => item.id)

      expect(result).toEqual({
        byId: {},
        ids: [],
      })
    })
  })

  describe("entifyWithAddress", () => {
    it("should transform an array of items into an EntityObjectWithAddress", () => {
      const result = entifyWithAddress(
        items,
        (item) => item.id,
        (item) => item.address,
      )

      expect(result).toEqual({
        byId: {
          "1": items[0],
          "2": items[1],
          "3": items[2],
        },
        byAddress: {
          address1: "1",
          address2: "2",
          address3: "3",
        },
        ids: ["1", "2", "3"],
        addresses: ["address1", "address2", "address3"],
      })
    })

    it("should handle an empty array", () => {
      const result = entifyWithAddress(
        [] as any[],
        (item) => item.id,
        (item) => item.address,
      )

      expect(result).toEqual({
        byId: {},
        byAddress: {},
        ids: [],
        addresses: [],
      })
    })
  })

  describe("enitifyPages", () => {
    const pages: Item[][] = [
      [
        { id: "1", address: "address1", name: "Item 1" },
        { id: "2", address: "address2", name: "Item 2" },
      ],
      [{ id: "3", address: "address3", name: "Item 3" }],
    ]

    it("should transform an array of pages into an EntityObject", () => {
      const result = enitifyPages(pages, (item) => item.id)

      expect(result).toEqual({
        byId: {
          "1": pages[0][0],
          "2": pages[0][1],
          "3": pages[1][0],
        },
        ids: ["1", "2", "3"],
      })
    })

    it("should handle an empty array of pages", () => {
      const items: any[] = []
      const result = enitifyPages(items, (item: any) => item.id)

      expect(result).toEqual({
        byId: {},
        ids: [],
      })
    })
  })
})
