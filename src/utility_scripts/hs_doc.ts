import loadStructuredData from "../data";
import { loadTextTree } from "../lib/utils/files";

const slugAliases = {
    "/": "div",
    "+": "plus",
    "-": "minus",
    "*": "mult",
    "=": "eq",
    "!=": "ne",
    ">": "gt",
    "<": "lt",
    ">=": "ge",
    "<=": "le",
};

function parseDoc(text: string) {
    const results: any = {functions: [], globals: []};
    let mode: "functions" | "globals" | undefined = undefined;
    for (let line of text.split("\n")) {
        line = line.trim();
        if (line == "; AVAILABLE FUNCTIONS:") {
            mode = "functions";
            continue;
        } else if (line == "; AVAILABLE EXTERNAL GLOBALS:") {
            mode = "globals";
            continue;
        } else if (mode == "functions") {
            const match = line.match(/\(<([\w\(\)]+)> ([\w\d_\)\()]+)((?:\s<[\w\(\)]+>)*)\)/);
            if (match) {
                const args: string[] = [];
                if (match[3]) {
                    for (let argMatch of match[3].matchAll(/<([\w\(\)]+)>/g)) {
                        args.push(argMatch[1]);
                    }
                }
                results.functions.push({name: match[2], type: match[1], args});
            }
        } else if (mode == "globals") {
            const match = line.match(/\(<([\w\(\)]+)> ([\w\d_\)\()]+)\)/);
            if (match) {
                results.globals.push({name: match[2], type: match[1]});
                // console.log(match[2]);
            }
        }
    }
    return results;
}

(async function main() {
    const docs = await loadTextTree<any>("./src/data/hs_docs");
    const data = await loadStructuredData() as any;
    
    const gameDocs = parseDoc(docs.h1.hs_doc_sapien);

    const docsFunctions = {};
    gameDocs.globals.forEach(func => {
        docsFunctions[func.name] = func;
    });

    const dataFunctions = {};
    data.hsc.h1.globals.external_globals.forEach(func => {
        dataFunctions[func.slug] = func;
    });

    const newDiff = Object.keys(docsFunctions).filter(n => !dataFunctions[n]);
    const removedDiff = Object.keys(dataFunctions).filter(n => !docsFunctions[n]);
    console.log(newDiff);
    console.log("---")
    console.log(removedDiff);
})();