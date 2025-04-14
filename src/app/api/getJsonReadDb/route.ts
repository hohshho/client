export async function POST(req: Request) {
    const body = await req.json(); // 여전히 클라이언트에서 POST로 받음

    const res = await fetch("http://localhost:8222/getJsonReadDb", {
        method: "GET",
        headers: {
            "Accept": "application/json",
        },
    });

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
        const text = await res.text();
        console.error("서버 응답 실패 상태코드:", res.status);
        console.error("서버 응답 본문:", text);
        return new Response("서버 오류 발생", { status: 500 });
    }

    if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("예상치 못한 응답 형식:", contentType);
        console.error("응답 본문:", text);
        return new Response("응답이 JSON이 아닙니다", { status: 500 });
    }

    const data = await res.json();
    return Response.json(data);
}