"use client";

export function TestPayloadClient(props: { test1?: any; test2?: any; test3?: any; test4?: any }) {
  const results = {
    test1: props.test1 === "🙂",
    test2: props.test2 === "<script>throw new Error('boom')</script>",
    test3:
      props.test3 instanceof Uint8Array &&
      isSameArray(props.test3, new TextEncoder().encode("🔥").reverse()),
    test4: props.test4 === "&><\u2028\u2029",
  };
  const format = (data: Record<string, any>) =>
    Object.entries(data)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(", ");
  return (
    <>
      <div>{format(results)}</div>
      <div>{format(props)}</div>
    </>
  );
}

function isSameArray(x: Uint8Array, y: Uint8Array) {
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}
