
export async function getWebGPUInfo(): Promise<string>
{
    const adapter = await navigator.gpu.requestAdapter();
    const c = adapter?.propertyIsEnumerable("info")
    return `
${adapter?.info.device}
${adapter?.info.architecture}
${adapter?.info.vendor}
${adapter?.info.description}
${Array.from(adapter?.features ?? []).join('\n')}
    `;
}