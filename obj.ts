import { float2, float3, float4 } from "./math";
import { ObjMesh, Vertex } from "./mesh";

export async function loadObjMesh(url: string): Promise<ObjMesh> {
    const text = await fetch(url).then(r => r.text());
    const lines = text.split(/\r?\n/);
    const pos: float3[] = [];
    const nor: float3[] = [];
    const uv: float2[] = [];
    const color: float4[] = [];
    const tangent: float3[] = [];
    const faces: { v: number; vt: number; vn: number; }[] = [];

    // 1回目: 属性リストとfaceリストを構築
    for (const line of lines) {
        const l = line.trim();
        if (l.startsWith('v ')) {
            const [x, y, z] = l.split(/\s+/).slice(1).map(Number);
            pos.push(new float3(x, y, z));
        } else if (l.startsWith('vn ')) {
            const [x, y, z] = l.split(/\s+/).slice(1).map(Number);
            nor.push(new float3(x, y, z));
        } else if (l.startsWith('vt ')) {
            const [x, y] = l.split(/\s+/).slice(1).map(Number);
            uv.push(new float2(x, y));
        } else if (l.startsWith('# vc')) {
            // # vc r g b [a]
            const comps = l.split(/\s+/).slice(2).map(Number);
            color.push(new float4(comps[0], comps[1], comps[2], comps[3] ?? 1));
        } else if (l.startsWith('# vt2')) {
            // # vt2 x y z
            const [x, y, z] = l.split(/\s+/).slice(2).map(Number);
            tangent.push(new float3(x, y, z));
        } else if (l.startsWith('f ')) {
            const vs = l.slice(2).split(/\s+/);
            for (const v of vs) {
                const [vi, ti, ni] = v.split('/').map(x => x ? parseInt(x) : undefined);
                faces.push({ v: (vi ?? 1) - 1, vt: (ti ?? 1) - 1, vn: (ni ?? 1) - 1 });
            }
        }
    }

    // 2回目: Vertex[]とindices[]を生成
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    for (let i = 0; i < faces.length; ++i) {
        vertices.push(new Vertex(
            pos[faces[i].v] || new float3(0, 0, 0),
            nor[faces[i].vn] || new float3(0, 0, 1),
            tangent[i] || new float3(0, 0, 0),
            color[i] || new float4(1, 1, 1, 1),
            uv[faces[i].vt] || new float2(0, 0),
        ));
        indices.push(i);
    }
    return new ObjMesh(vertices, indices);
}
