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

    const module = device.createShaderModule({
        label: 'red triangle',
        code: /* wgsl */`
            @vertex fn vs(
                @builtin(vertex_index) vertexIndex : u32
            ) -> @builtin(position) vec4f {
                let pos = array(
                    vec2f(0.0, 0.5),
                    vec2f(-0.5, -0.5),
                    vec2f(0.5, -0.5)
                );
                
                return vec4f(pos[vertexIndex], 0.0, 1.0);
            }

            @fragment fn fs() -> @location(0) vec4f {
                return vec4f(1.0, 0.0, 0.0, 1.0);
            }
        `,
    });

    const pipeline = device.createRenderPipeline({
        label: 'red triangle pipline',
        layout: 'auto',
        vertex: { 
            entryPoint: 'vs',
            module,
        },
        fragment: {
            entryPoint: 'fs',
            module,
            targets: [{ format: presentationFormat }],
        },
    });

    const renderPassDecriptor = {
        label: 'canvas renderPass',
        colorAttachments: [
            {
                // view <- to be filled out when we render [Ed: ?]
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
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

    render();
}

function fail(msg) {
    console.log(msg);
    alert(msg);
}

main();