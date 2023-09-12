import { Params } from "../lib/params.ts";

type AssertEquals<T, U> =
    (<V>() => V extends T ? 1 : 2) extends
    (<V>() => V extends U ? 1 : 2) ? true : false;

Deno.test("Params", () => {
    const _01: AssertEquals<Params<"/user/:id">,                   "id"                 > = true;
    const _02: AssertEquals<Params<"/user/:id/?">,                 "id"                 > = true;
    const _03: AssertEquals<Params<"/:first/:repeating+">,         "first" | "repeating"> = true;
    const _04: AssertEquals<Params<"/books/:id(\\d+)*">,           "id"                 > = true;
    const _05: AssertEquals<Params<"/:a-:b">,                      "a" | "b"            > = true;
    const _06: AssertEquals<Params<"/:a.:b">,                      "a" | "b"            > = true;
    const _07: AssertEquals<Params<"/:test*/*">,                   "test" | 0           > = true;
    const _08: AssertEquals<Params<"/test*/**/****">,              0 | 1 | 2 | 3        > = true;
    const _09: AssertEquals<Params<"/file/:name.*/(\\w+)">,        "name" | 0 | 1       > = true;
    const _10: AssertEquals<Params<"/file/:name.:test*/:w(\\w+)">, "name" | "test" | "w"> = true;
    const _11: AssertEquals<Params<"/*ababa*">,                    0 | 1                > = true;
    const _12: AssertEquals<Params<"/:a-:b/:c-:d">,                "a" | "b" | "c" | "d"> = true;
    const _13: AssertEquals<Params<"/test*/(hei)*/****">,          0 | 1 | 2 | 3        > = true;
    const _14: AssertEquals<Params<"/(group)/*/(group2)*/**">,     0 | 1 | 2 | 3        > = true;
    const _15: AssertEquals<Params<"/(group(innergroup))*">,       0                    > = true;
    const _16: AssertEquals<Params<"/(group(innergroup))*/*">,     0 | 1                > = true;
});
