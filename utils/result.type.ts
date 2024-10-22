/**
 * A generic Result class that represents either a success value or an error.
 * This class is useful for handling operations that can fail, providing a type-safe
 * way to represent and handle both successful and failed outcomes.
 *
 * @typeparam T The type of the success value.
 */
// TODO: add an idea of asyncResult where
// we have "unasked", error, success to more accurately
// represent that data isnt "null", we just
// haven't tried to get it yet
export class Result<T> {
  private constructor(
    private readonly value: T | null,
    private readonly error: Error | null
  ) {}

  /**
   * Creates a successful Result containing the given value.
   *
   * @param value The value to be wrapped in a successful Result.
   * @returns A new Result instance representing a success.
   *
   * @example
   * const successResult = Result.success(42);
   * console.log(successResult.isSuccess()); // true
   * console.log(successResult.getValue()); // 42
   */
  static success<U>(value: U): Result<U> {
    return new Result(value, null);
  }

  /**
   * Creates a failed Result containing the given error.
   *
   * @param error The error to be wrapped in a failed Result.
   * @returns A new Result instance representing a failure.
   *
   * @example
   * const failureResult = Result.failure(new Error("Something went wrong"));
   * console.log(failureResult.isFailure()); // true
   * console.log(failureResult.getError().message); // "Something went wrong"
   */
  static failure<U>(error: Error): Result<U> {
    return new Result<U>(null, error);
  }

  /**
   * Checks if the Result is successful.
   *
   * @returns true if the Result represents a success, false otherwise.
   *
   * @example
   * const result = Result.success("Hello");
   * console.log(result.isSuccess()); // true
   */
  isSuccess(): boolean {
    return this.error === null;
  }

  /**
   * Checks if the Result is a failure.
   *
   * @returns true if the Result represents a failure, false otherwise.
   *
   * @example
   * const result = Result.failure(new Error("Oops"));
   * console.log(result.isFailure()); // true
   */
  isFailure(): boolean {
    return this.error !== null;
  }

  /**
   * Gets the success value if the Result is successful.
   *
   * @returns The success value.
   * @throws Error if the Result represents a failure.
   *
   * @example
   * const result = Result.success("Hello, World!");
   * if (result.isSuccess()) {
   *   console.log(result.getValue()); // "Hello, World!"
   * }
   */
  getValue(): T {
    if (this.isFailure()) {
      throw new Error("Cannot get value from a failed Result");
    }
    return this.value as T;
  }

  /**
   * Gets the error if the Result is a failure.
   *
   * @returns The error.
   * @throws Error if the Result represents a success.
   *
   * @example
   * const result = Result.failure(new Error("File not found"));
   * if (result.isFailure()) {
   *   console.log(result.getError().message); // "File not found"
   * }
   */
  getError(): Error {
    if (this.isSuccess()) {
      throw new Error("Cannot get error from a successful Result");
    }
    return this.error as Error;
  }

  /**
   * Applies a function to the contained value if the Result is a success.
   * If the Result is a failure, it returns a new Result with the same error.
   * Use map when your transformation always succeeds and returns a regular value.
   *
   * @param fn The function to apply to the success value.
   * @returns A new Result containing the result of the function application, or the original error.
   *
   * @example
   * // Success case
   * const successResult = Result.success(5);
   * const doubled = successResult.map(x => x * 2);
   * console.log(doubled.getValue()); // 10
   *
   * // Failure case
   * const failureResult = Result.failure<number>(new Error("Invalid input"));
   * const shouldNotDouble = failureResult.map(x => x * 2);
   * console.log(shouldNotDouble.isFailure()); // true
   * console.log(shouldNotDouble.getError().message); // "Invalid input"
   */
  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isSuccess()) {
      return Result.success(fn(this.getValue()));
    }
    return Result.failure(this.getError());
  }

  /**
   * Applies a function that returns a Result to the contained value if this Result is a success.
   * If this Result is a failure, it returns a new Result with the same error.
   * Use flatMap when your transformation might fail or when it returns another Result.
   *
   * The key difference between map and flatMap:
   * - map is for simple transformations that always succeed.
   * - flatMap is for operations that might fail or that return a Result themselves.
   *
   * @param fn The function to apply to the success value.
   * @returns The Result returned by the function, or this Result if it's a failure.
   *
   * @example
   * function divide(a: number, b: number): Result<number> {
   *   if (b === 0) return Result.failure(new Error("Division by zero"));
   *   return Result.success(a / b);
   * }
   *
   * // Success case
   * const successResult = Result.success(10)
   *   .flatMap(x => divide(x, 2))
   *   .flatMap(x => divide(x, 2));
   * console.log(successResult.getValue()); // 2.5
   *
   * // Failure case: division by zero
   * const failureResult = Result.success(10)
   *   .flatMap(x => divide(x, 2))
   *   .flatMap(x => divide(x, 0));
   * console.log(failureResult.isFailure()); // true
   * console.log(failureResult.getError().message); // "Division by zero"
   *
   * // Failure case: starting with a failure
   * const initialFailure = Result.failure<number>(new Error("Initial error"))
   *   .flatMap(x => divide(x, 2));
   * console.log(initialFailure.isFailure()); // true
   * console.log(initialFailure.getError().message); // "Initial error"
   *
   * // Example demonstrating the need for flatMap:
   * function getUser(id: number): Result<User> {
   *   // Imagine this fetches a user from a database
   *   // It might fail, so it returns a Result
   * }
   *
   * function getUserEmail(user: User): Result<string> {
   *   // This might fail if the user doesn't have an email
   *   // So it also returns a Result
   * }
   *
   * // Using flatMap to chain operations that return Results
   * const userEmailResult = getUser(123)
   *   .flatMap(user => getUserEmail(user));
   *
   * // If we tried to use map, it wouldn't work correctly:
   * const incorrectResult = getUser(123)
   *   .map(user => getUserEmail(user)); // This would be Result<Result<string>>, not what we want!
   *
   * // flatMap "flattens" the nested Result, giving us a Result<string> as desired.
   */
  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isSuccess()) {
      return fn(this.getValue());
    }
    return Result.failure(this.getError());
  }
}
