export async function POST(req: Request) {
    const body = await req.json();

    const res = await fetch("http://localhost:8222/deletePOI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    return Response.json(data);
}

