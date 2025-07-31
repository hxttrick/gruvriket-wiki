const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

async function tryCatch(promise) {
    try {
        const data = await promise;
        return [data, null];
    } catch (error) {
        console.error(error);
        return [null, error];
    }
}