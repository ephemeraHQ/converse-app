// All types here should be in global.d.ts but for some reason they are not working in global.d.ts

import { ReactElement, ReactNode } from "react"

// so we put them here and import them...
export type Nullable<T> = T | null | undefined

export type NonNullable<T> = Exclude<T, null | undefined>

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

// All prop are optional but some of those are required
export type PartialWithRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>

export type Simplify<T> = T extends infer S ? { [K in keyof S]: S[K] } : never
export type NoneOf<T> = Simplify<{ [K in keyof T]?: never }>
export type AtMostOneOf<T> =
  | NoneOf<T>
  | { [K in keyof T]: Simplify<Pick<T, K> & NoneOf<Omit<T, K>>> }[keyof T]

// @ts-ignore
export type SupabaseData<T> = Awaited<ReturnType<T>>["data"]

export type FilterByValueType<T extends object, Type> = {
  [K in keyof T as T[K] extends Type ? K : never]: T[K]
}

export type PromiseReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<T>>

export type IValueTypes<T> = T extends Record<string, infer U> ? U : never

export type NonNullPick<T, K extends keyof T> = {
  [P in K]-?: NonNullable<T[P]>
}

export type NonNullableProperty<T, K extends keyof T> = {
  [P in K]-?: NonNullable<T[P]>
}

export type NestedOmit<T, K extends string> = {
  [P in keyof T as Extract<P, string>]: K extends `${Extract<P, string>}.${infer R}`
    ? R extends keyof T[P]
      ? Omit<T[P], R>
      : T[P]
    : T[P]
}

// Built-ins documented here: https://www.typescriptlang.org/docs/handbook/utility-types.html
export type ValueOf<T> = T[keyof T]

// Checks if all keys in T are in U and vice versa
export type KeysCheck<T extends readonly string[], U> = T[number] extends keyof U
  ? keyof U extends T[number]
    ? true
    : false
  : false

// We don't put string/number because in react-native we can't
export type MyReactNode =
  | ReactNode
  | ReactElement
  | JSX.Element
  | (() => ReactNode)
  | (() => ReactElement)
  | number
  | string

export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Required<Pick<T, K>> & { [P in Exclude<Keys, K>]?: undefined }
}[Keys] &
  Omit<T, Keys>
