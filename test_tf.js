const tf = (() => {
  try {
    return require('@tensorflow/tfjs-node-gpu')
  } catch {
    return require('@tensorflow/tfjs-node')
  }
})()

const r = (v) => { return Math.round(v * 1e3) / 1e3 }
function pw(size, iters, warmup) {
  const a = tf.randomNormal([size])

  const op = (K) => {
      let b = a
      for (let i = 0; i < K; ++i) {
          b = b.add(a)
      }
      const o = b.sum().dataSync()[0]
  }

  op(warmup)
  const t0 = performance.now();
  op(iters)
  const t1 = performance.now();
  const bs = size * 4 * iters + size * 4
  const gbs = bs / (1e6 * (t1-t0))
  const kitersec = iters / (t1-t0)
  console.log(`${r(kitersec)}K iter/s`, `${r(gbs)} GB/s`)
}

function mm(size, iters, warmup) {
  const N = size
  const a = tf.randomNormal([N, N])
  const b = tf.eye(N)
  const op = (K) => {
    let c = a
    for (let i = 0; i < K; ++i) {
      c = c.matMul(b)
    }
    const o = c.sum().dataSync()[0]
  }
  op(warmup)
  const t0 = performance.now();
  op(iters)
  const t1 = performance.now();
  const flops = Math.pow(N, 3) * 2 * iters + N * N
  const gflops = flops / (1e6 * (t1-t0));
  console.log(`${r(gflops)} GFlop/s`)
}

function mm_pw(size, iters, warmup) {
  const N = size
  const a = tf.randomNormal([64, N])
  const b = tf.eye(N)
  const c = tf.randomNormal([1, N])

  const op = (K) => {
    let d = a
    for (let i = 0; i < K; ++i) {
      d = d.matMul(b)
      for (let j = 0; j < 5; ++j) {
        d = d.add(c)
      }
    }
    const o = d.sum().dataSync()[0]
    return o
  }

  op(warmup)
  const t0 = performance.now();
  op(iters)
  const t1 = performance.now();

  const kitersec = iters / (t1-t0)
  console.log(`${r(kitersec)}K iter/s`)
}


function err() {
  console.log(`usage: ${process.argv[0]} ${process.argv[1]} {pw,mm,mm_pw} size iters warmup`)
  process.exit(1)
}
if (process.argv.length < 6) {
  err()
}
const v = process.argv[2]
const size = Number(process.argv[3])
const iters = Number(process.argv[4])
const warmup = Number(process.argv[5])

if (v === "pw") {
  pw(size, iters, warmup)
} else if (v === "mm_pw") {
  mm_pw(size, iters, warmup)
} else {
  mm(size, iters, warmup)
}
