// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if(!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const response = await fetch("./triangle.wgsl");
    if(!response.ok) {
        fail("Failed to load shaders");
        return;
    }

    const shaderCode = await response.text();

    const module = device.createShaderModule({
        label: 'red triangle',
        code: shaderCode,
    });

    const pipeline = device.createRenderPipeline({
        label: 'red triangle pipline',
        layout: 'auto',
        vertex: { 
            entryPoint: 'hardcodedTriangles',
            module,
        },
        fragment: {
            entryPoint: 'headache',
            module,
            targets: [{ format: presentationFormat }],
        },
    });

    const renderPassDecriptor = {
        label: 'canvas renderPass',
        colorAttachments: [
            {
                // view <- gets filled in in first line of render() (why?)
                clearValue: [.3, .3, .3, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }
        ],
    };

    function render() {
        // get the current texture from the canvas context and set it as
        // the texture to render to
        renderPassDecriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // command encoder encodes commands [Ed: :|]
        const encoder = device.createCommandEncoder({ label: 'myEncoder'});

        // make a render pass encoder to render specific commands
        const pass = encoder.beginRenderPass(renderPassDecriptor);
        pass.setPipeline(pipeline);
        pass.draw(6);
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]); // nothing happens until here - where the commands are all sent to the queue
    }

    render();
}

function fail(msg) {
    console.log(msg);
    alert(msg);
}

main();