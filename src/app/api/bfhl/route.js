import { NextResponse } from 'next/server';

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const data = body.data;

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: "Invalid input. 'data' must be an array." }, { status: 400 });
        }

        let invalid_entries = [];
        let valid_edges = [];
        
        // 1. Trim and Validate
        for (let item of data) {
            if (typeof item !== 'string') {
                invalid_entries.push(item);
                continue;
            }
            let trimmed = item.trim();
            if (/^[A-Z]->[A-Z]$/.test(trimmed)) {
                let [X, Y] = trimmed.split("->");
                if (X === Y) {
                    invalid_entries.push(item); // Self loop is invalid
                } else {
                    valid_edges.push(trimmed);
                }
            } else {
                invalid_entries.push(item);
            }
        }

        // 2. Duplicates and Unique
        let seen = new Set();
        let duplicate_set = new Set();
        let unique_edges = [];
        for (let edge of valid_edges) {
            if (seen.has(edge)) {
                duplicate_set.add(edge);
            } else {
                seen.add(edge);
                unique_edges.push(edge);
            }
        }
        let duplicate_edges = Array.from(duplicate_set);

        // 3. Filter multi-parents
        let filtered_edges = [];
        let child_to_parent = new Map();
        for (let edge of unique_edges) {
            let [X, Y] = edge.split("->");
            if (!child_to_parent.has(Y)) {
                child_to_parent.set(Y, X);
                filtered_edges.push([X, Y]);
            }
        }

        // 4. Components
        let adj = new Map();
        let directed_adj = new Map();
        let in_degree = new Map();
        let nodes = new Set();

        for (let [X, Y] of filtered_edges) {
            nodes.add(X);
            nodes.add(Y);
            if (!adj.has(X)) adj.set(X, []);
            if (!adj.has(Y)) adj.set(Y, []);
            adj.get(X).push(Y);
            adj.get(Y).push(X);

            if (!directed_adj.has(X)) directed_adj.set(X, []);
            directed_adj.get(X).push(Y);
            
            if (!in_degree.has(X)) in_degree.set(X, 0);
            if (!in_degree.has(Y)) in_degree.set(Y, 0);
            in_degree.set(Y, in_degree.get(Y) + 1);
        }

        // Find connected components
        let visited = new Set();
        let components = [];
        let sortedNodes = Array.from(nodes).sort();
        
        for (let node of sortedNodes) {
            if (!visited.has(node)) {
                let comp = [];
                let q = [node];
                visited.add(node);
                while (q.length > 0) {
                    let curr = q.shift();
                    comp.push(curr);
                    for (let neighbor of (adj.get(curr) || [])) {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            q.push(neighbor);
                        }
                    }
                }
                components.push(comp);
            }
        }

        let hierarchies = [];
        let total_trees = 0;
        let total_cycles = 0;
        let max_depth = 0;
        let largest_tree_root = null;

        function buildTreeInternal(node) {
            let obj = {};
            let max_d = 0;
            let children = directed_adj.get(node) || [];
            children.sort();
            for (let child of children) {
                let res = buildTreeInternal(child);
                obj[child] = res.obj;
                if (res.depth > max_d) max_d = res.depth;
            }
            return { obj, depth: 1 + max_d };
        }

        for (let comp of components) {
            let roots = [];
            for (let node of comp) {
                if (in_degree.get(node) === 0) {
                    roots.push(node);
                }
            }

            if (roots.length === 0) {
                total_cycles++;
                comp.sort();
                let root = comp[0];
                hierarchies.push({
                    root: root,
                    tree: {},
                    has_cycle: true
                });
            } else {
                total_trees++;
                let root = roots[0];
                let res = buildTreeInternal(root);
                hierarchies.push({
                    root: root,
                    tree: { [root]: res.obj },
                    depth: res.depth
                });

                if (res.depth > max_depth) {
                    max_depth = res.depth;
                    largest_tree_root = root;
                } else if (res.depth === max_depth) {
                    if (!largest_tree_root || root < largest_tree_root) {
                        largest_tree_root = root;
                    }
                }
            }
        }

        hierarchies.sort((a, b) => a.root.localeCompare(b.root));

        const responseObj = {
            user_id: "Manish_28102005",
            email_id: "mk2372@srmist.edu.in",
            college_roll_number: "RA2311003012343",
            hierarchies,
            invalid_entries,
            duplicate_edges,
            summary: {
                total_trees,
                total_cycles,
                largest_tree_root: largest_tree_root || ""
            }
        };

        return NextResponse.json(responseObj, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
