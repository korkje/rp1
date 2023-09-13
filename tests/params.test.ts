import { Params } from "../lib/params.ts";

type AssertEq<T, U> =
    (<V>() => V extends T ? 1 : 2) extends
    (<V>() => V extends U ? 1 : 2) ? true : false;

Deno.test("Params", () => {
    const _01: AssertEq<Params<"/user/:id">,                   "id"                 > = true;
    const _02: AssertEq<Params<"/user/:id/?">,                 "id"                 > = true;
    const _03: AssertEq<Params<"/:first/:repeating+">,         "first" | "repeating"> = true;
    const _04: AssertEq<Params<"/books/:id(\\d+)*">,           "id"                 > = true;
    const _05: AssertEq<Params<"/:a-:b">,                      "a" | "b"            > = true;
    const _06: AssertEq<Params<"/:a.:b">,                      "a" | "b"            > = true;
    const _07: AssertEq<Params<"/:test*/*">,                   "test" | 0           > = true;
    const _08: AssertEq<Params<"/test*/**/****">,              0 | 1 | 2 | 3        > = true;
    const _09: AssertEq<Params<"/file/:name.*/(\\w+)">,        "name" | 0 | 1       > = true;
    const _10: AssertEq<Params<"/file/:name.:test*/:w(\\w+)">, "name" | "test" | "w"> = true;
    const _11: AssertEq<Params<"/*ababa*">,                    0 | 1                > = true;
    const _12: AssertEq<Params<"/:a-:b/:c-:d">,                "a" | "b" | "c" | "d"> = true;
    const _13: AssertEq<Params<"/test*/(hei)*/****">,          0 | 1 | 2 | 3        > = true;
    const _14: AssertEq<Params<"/(group)/*/(group2)*/**">,     0 | 1 | 2 | 3        > = true;
    const _15: AssertEq<Params<"/(group(innergroup))*">,       0                    > = true;
    const _16: AssertEq<Params<"/(group(innergroup))*/*">,     0 | 1                > = true;
    const _17: AssertEq<Params<"/(a(b(c)(d)))">,               0                    > = true;
    const _18: AssertEq<Params<"/:param(\\d+)eter">,           "param"              > = true;
    const _19: AssertEq<Params<"/date/(\\d+)-(\\d+)-(\\d+)">,  0 | 1 | 2            > = true;
    const _20: AssertEq<Params<"/file/:name.:ext(\\w+)">,      "name" | "ext"       > = true;
    const _21: AssertEq<Params<"/abc\\:def">,                  never                > = true;
    const _22: AssertEq<Params<"/abc\\:def/:test">,            "test"               > = true;
    const _23: AssertEq<Params<"/:a_b-c/:d$e@f">,              "a_b" | "d$e"        > = true;
    const _24: AssertEq<Params<"/\\(group\\)">,                never                > = true;
    const _25: AssertEq<Params<"/\\(group\\)/(abc)">,          0                    > = true;
    const _26: AssertEq<Params<"/path{/:subpath}**">,          0 | "subpath"        > = true;
    const _27: AssertEq<Params<"/:param**">,                   "param" | 0          > = true;
});
