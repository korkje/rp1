export type Delim = "!" | "\"" | "#" /*| "$" */| "%" | "&" | "'" | "(" | ")" | "*" | "+" | "," | "-" | "." | "/" | ":" | ";" | "<" | "=" | ">" | "?" | "@" | "[" | "\\" | "]" | "^" /*| "_" */| "`" | "{" | "|" | "}" | "~";

export type Add<Counter extends unknown[], Item = unknown> = [...Counter, Item];
export type Size<T extends unknown[]> = T['length'];

export type RemoveGroups<Path extends string> =
    Path extends `${infer Head}(${string}(${string}(${string})${string})${string})${infer Tail}`
        ? Tail extends `${Delim}${infer _}`
            ? RemoveGroups<`${Head}${Tail extends `*${infer Tail2}` ? Tail2 : Tail}`>
            : RemoveGroups<`${Head}-${Tail}`>
        : Path extends `${infer Head}(${string}(${string})${string})${infer Tail}`
            ? Tail extends `${Delim}${infer _}`
                ? RemoveGroups<`${Head}${Tail extends `*${infer Tail2}` ? Tail2 : Tail}`>
                : RemoveGroups<`${Head}-${Tail}`>
            : Path extends `${infer Head}(${string})${infer Tail}`
                ? Tail extends `${Delim}${infer _}`
                    ? RemoveGroups<`${Head}${Tail extends `*${infer Tail2}` ? Tail2 : Tail}`>
                    : RemoveGroups<`${Head}-${Tail}`>
                : Path;

export type CleanParam<Param extends string> =
    Param extends `${infer Cleaned}${Delim}${infer _}`
        ? CleanParam<Cleaned>
        : Param;

export type ExtractParams<Path extends string> =
    Path extends `${infer _}:${infer Param}:${infer Rest}`
        ? ExtractParams<`:${Rest}`> | CleanParam<Param>
        : Path extends `${infer _}:${infer Param}`
            ? CleanParam<Param>
            : never;

export type CountWildcards<Path extends string, Params extends string, Counter extends unknown[] = []> =
    Path extends `${infer Head}**${infer Tail}`
        ? Head extends `${infer _}:${Params}`
            ? CountWildcards<`${Head}${Tail}`, Params, Counter>
            : CountWildcards<`${Head}${Tail}`, Params, Add<Counter, Size<Counter>>>
        : Path extends `${infer Head}*${infer Tail}`
            ? Head extends `${infer _}:${Params}`
                ? CountWildcards<`${Head}${Tail}`, Params, Counter>
                : CountWildcards<`${Head}${Tail}`, Params, Add<Counter, Size<Counter>>>
            : Counter;

export type CountGroups<Path extends string, Params extends string, Counter extends unknown[] = []> =
    Path extends `${infer Head}(${string})${infer Tail}`
        ? Head extends `${infer _}:${Params}`
            ? CountGroups<`${Head}${Tail}`, Params, Counter>
            : CountGroups<`${Head}${Tail}`, Params, Add<Counter, Size<Counter>>>
        : Counter;

export type AddNumbers<Path extends string, Params extends string> =
    Params | CountWildcards<RemoveGroups<Path>, Params, CountGroups<Path, Params>>[number];

export type Params<Path extends string> = AddNumbers<Path, ExtractParams<RemoveGroups<Path>>>;

export default Params;
