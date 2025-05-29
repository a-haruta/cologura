export class float2 {
    constructor(public x: number, public y: number) {}
    static zero() { return new float2(0, 0); }
}
export class float3 {
    constructor(public x: number, public y: number, public z: number) {}
    static zero() { return new float3(0, 0, 0); }
}
export class float4 {
    constructor(public x: number, public y: number, public z: number, public w: number) {}
    static zero() { return new float4(0, 0, 0, 0); }
}