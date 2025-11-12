<script lang="js">
    import { onMount } from "svelte";

    let canvas;
    let ctx;
    let drawing = false;
    let socket;
    let color = "#00aaff";
    let size = 3;
    let prev = { x: 0, y: 0 };
    let tool = "pen"; // "pen" of "eraser"

    onMount(() => {
        ctx = canvas.getContext("2d");
        socket = new WebSocket("ws://" + window.location.hostname + ":8080");

        socket.onopen = () => console.log("✅ Connected to WebSocket server");
        socket.onerror = (e) => console.error("❌ WebSocket error", e);
        socket.onclose = () => console.warn("⚠️ WebSocket closed");

        socket.onmessage = async (event) => {
            let text;
            if (event.data instanceof Blob) text = await event.data.text();
            else text = event.data;

            try {
                const data = JSON.parse(text);

                if (data.clear) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    return;
                }

                if (data.x1 !== undefined) {
                    drawLine(
                        data.x1,
                        data.y1,
                        data.x2,
                        data.y2,
                        data.color,
                        data.size,
                    );
                }
            } catch (err) {
                console.warn("⚠️ Non-JSON message:", text);
            }
        };
    });

    function start(e) {
        drawing = true;
        prev = getPos(e);
    }

    function stop() {
        drawing = false;
    }

    function draw(e) {
        if (!drawing) return;
        const pos = getPos(e);
        const drawColor = tool === "eraser" ? "#ffffff" : color;
        const drawSize = tool === "eraser" ? size * 2 : size;

        socket.send(
            JSON.stringify({
                x1: prev.x,
                y1: prev.y,
                x2: pos.x,
                y2: pos.y,
                color: drawColor,
                size: drawSize,
            }),
        );

        drawLine(prev.x, prev.y, pos.x, pos.y, drawColor, drawSize);
        prev = pos;
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function drawLine(x1, y1, x2, y2, color, size) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
</script>

<div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6"
>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">
        🌊 AquaSketch Whiteboard
    </h1>

    <!-- Toolbar -->
    <div class="flex items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-md">
        <label class="flex items-center gap-2 text-gray-700">
            Tool:
            <select bind:value={tool} class="border rounded p-1">
                <option value="pen">Pen</option>
                <option value="eraser">Eraser</option>
            </select>
        </label>

        <label class="flex items-center gap-2 text-gray-700">
            Color:
            <input
                type="color"
                bind:value={color}
                class="w-10 h-8 rounded border border-gray-300 cursor-pointer"
            />
        </label>

        <label class="flex items-center gap-2 text-gray-700">
            Size:
            <input
                type="range"
                min="1"
                max="10"
                bind:value={size}
                class="w-32"
            />
        </label>

        <button
            on:click={() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                socket.send(JSON.stringify({ clear: true }));
            }}
            class="ml-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
            Clear
        </button>
    </div>

    <!-- Canvas -->
    <div class="bg-white rounded-lg shadow-lg">
        <canvas
            bind:this={canvas}
            width="800"
            height="600"
            on:mousedown={start}
            on:mousemove={draw}
            on:mouseup={stop}
            on:mouseleave={stop}
            class="rounded-lg border border-gray-300"
        ></canvas>
    </div>

    <p class="mt-4 text-gray-600">
        Teken samen in realtime met andere gebruikers!
    </p>
</div>
