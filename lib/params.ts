type Delim = "!" | "\"" | "#" /*| "$" */| "%" | "&" | "'" | "(" | ")" | "*" | "+" | "," | "-" | "." | "/" | ":" | ";" | "<" | "=" | ">" | "?" | "@" | "[" | "\\" | "]" | "^" /*| "_" */| "`" | "{" | "|" | "}" | "~";

type Add<List extends unknown[], Item = unknown> = [...List, Item];
type Increment<Counter extends unknown[]> = [...Counter, unknown];
type Decrement<Counter extends unknown[]> = Counter extends [unknown, ...infer Rest] ? Rest : Counter;
type Size<T extends unknown[]> = T['length'];

type IfEmpty<Path extends string, Then, Else> = Path extends "" ? Then : Else;

// export type RemoveNonCapturingGroups<Path extends string> =
//     Path extends `${infer Head}}${infer Tail}`
//     ? Head extends `${string}\\`
//         ? RemoveNonCapturingGroups<`${Head}#${Tail}`>
//         : Tail extends `*${infer Tail2}`
//             ? RemoveNonCapturingGroups<`${Head}#${Tail2}`>
//             : RemoveNonCapturingGroups<`${Head}#${Tail}`>
//     : Path extends `${infer Head}{${infer Tail}`
//         ? Head extends `${string}\\`
//             ? RemoveNonCapturingGroups<`${Head}#${Tail}`>
//             : RemoveNonCapturingGroups<`${Head}#${Tail}`>
//         : Path;

type RemoveGroup<Path extends string, Counter extends unknown[] = [unknown]> =
    Size<Counter> extends 0 ? Path extends `*${infer Rest}` ? Rest : Path :
    Path extends `(${infer Rest}` ? RemoveGroup<Rest, Increment<Counter>> :
    Path extends `)${infer Rest}` ? RemoveGroup<Rest, Decrement<Counter>> :
    Path extends `${"\\(" | "\\)"}${infer Rest}` ? RemoveGroup<Rest, Counter> :
    Path extends `${string}${infer Rest}` ? IfEmpty<Rest, Path, RemoveGroup<Rest, Counter>> :
    never;

type RemoveGroups<Path extends string> =
    Path extends `${infer Head}(${infer Tail}`
    ? Head extends `${string}\\`
        ? RemoveGroups<`${Head}#${Tail}`>
        : RemoveGroups<`${Head}#${RemoveGroup<Tail>}`>
    : Path;
    // : RemoveNonCapturingGroups<Path>;

type CountGroups<Path extends string, Params extends string, Counter extends unknown[] = []> =
    Path extends `${infer Head}(${infer Tail}`
    ? Head extends `${string}\\`
        ? CountGroups<Tail, Params, Counter>
        : Head extends `${string}:${Params}`
            ? CountGroups<RemoveGroup<Tail>, Params, Counter>
            : CountGroups<RemoveGroup<Tail>, Params, Add<Counter, Size<Counter>>>
    : Counter;

type CleanParam<Param extends string> =
    Param extends `${infer Cleaned}${Delim}${string}`
    ? CleanParam<Cleaned>
    : Param;

type ExtractParams<Path extends string> =
    Path extends `${infer Head}:${infer Param}:${infer Tail}`
    ? Head extends `${string}\\`
        ? ExtractParams<`:${Tail}`>
        : ExtractParams<`:${Tail}`> | CleanParam<Param>
    : Path extends `${infer Head}:${infer Param}`
        ? Head extends `${string}\\`
            ? never
            : CleanParam<Param>
        : never;

type CountWildcards<Path extends string, Params extends string, Counter extends unknown[] = []> =
    Path extends `${infer Head}**${infer Tail}`
    ? CountWildcards<`${Head}${Tail}`, Params, Add<Counter, Size<Counter>>>
    : Path extends `${infer Head}*${infer Tail}`
        ? Head extends `${string}:${Params}`
            ? CountWildcards<`${Head}${Tail}`, Params, Counter>
            : CountWildcards<`${Head}${Tail}`, Params, Add<Counter, Size<Counter>>>
        : Counter;

type AddNumbers<Path extends string, Params extends string> =
    Params | CountWildcards<RemoveGroups<Path>, Params, CountGroups<Path, Params>>[number];

/**
 * Extracts parameters from a path string.
 */
export type Params<Path extends string> = AddNumbers<Path, ExtractParams<RemoveGroups<Path>>>;

export default Params;
