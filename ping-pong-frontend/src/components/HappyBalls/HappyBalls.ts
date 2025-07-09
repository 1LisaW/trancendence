type Configuration = {
  color: string
  minSpeed: number
  maxSpeed: number,
  size: number,
}

type Ball = {
  el: HTMLDivElement
  size: number
  pos: {
    x: number
    y: number
  }
  velocity: {
    x: number
    y: number
  }
  speed: number
}

const BASE_OPTIONS: Configuration = {
  color : '#000',
  minSpeed : 120,
  maxSpeed : 600,
  size: 20,
}

export class HappyBalls {
  options: Configuration
  balls: Ball[] = []
  viewport = {
    width: 0,
    height: 0,
  }
  animation = true
  root: HTMLDivElement
  tick = 0

  _errorThreshold = 6

  constructor(options: Partial<Configuration> & {
    amount: number
  } = {
    amount: 2,
    ...BASE_OPTIONS,
  }) {
    let {
      amount,
        color,
        minSpeed,
        maxSpeed,
        size,
    } = {
      ...BASE_OPTIONS,
      ...options,
    }
    this.root = document.createElement('div')
    this.root.className = 'happy-balls'
    this.root.style.position = 'absolute'
    this.root.style.width = '100%'
    this.root.style.height = '100%'
    this.root.style.top = '0px'
    this.root.style.left = '0px'
    this.root.style.zIndex = '5'
    this.root.style.pointerEvents = 'none'
    document.body.appendChild(this.root)

    this._recalcViewport()
    window.addEventListener('resize', this._recalcViewport)

    maxSpeed = Math.max(maxSpeed!, minSpeed!)
    this.options = {
      color: color!,
      minSpeed: minSpeed!,
      maxSpeed: maxSpeed!,
      size: size!,
    }

    this.animation = true

    for (let i = 0; i < amount; i++) {
      this.addBall()
    }

    this._init()
  }

  destroy() {
    this.animation = false

    document.removeEventListener('visibilitychange', this._restoreLoop);
    document.removeEventListener('resize', this._recalcViewport)

    while (this.removeBall(0)) {
      // wait
    }

    document.body.removeChild(this.root)
  }

  // not required parameters
  addBall(options?: Configuration) {
    const {
      color,
      minSpeed ,
      maxSpeed ,
      size,
    } = options || this.options

    const x = Math.floor(Math.random() * this.viewport.width * 100) / 100
    const y = Math.floor(Math.random() * this.viewport.height * 100) / 100

    const newBallEl = document.createElement('div')
    newBallEl.style.position = 'absolute'
    newBallEl.style.left = `-${size/2}px`
    newBallEl.style.top = `-${size/2}px`
    newBallEl.style.width = `${size}px`
    newBallEl.style.height = `${size}px`
    newBallEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
    newBallEl.style.borderRadius = '100%'
    newBallEl.style.backgroundColor = color
    this.root.appendChild(newBallEl)

    const speed = Math.floor((Math.random() * (maxSpeed - minSpeed) + minSpeed) * 100) / 100
    const { x: velocityX, y: velocityY} = this._getRandomVector(speed)

    this.balls.push({
      el: newBallEl,
      size: size,
      pos: {
        x,
        y,
      },
      velocity: {
        x: velocityX,
        y: velocityY,
      },
      speed: Math.floor((Math.random() * (maxSpeed - minSpeed) + minSpeed) * 100) / 100,
    })
  }


  removeBall(num: number) {
    const ball = this.balls[num]
    if (!ball) {
      return false
    }

    this.root.removeChild(ball.el)
    this.balls = this.balls.filter((_, i) => i !== num)

    return true
  }

  _init() {
    this.tick = performance.now();
    document.addEventListener('visibilitychange', this._restoreLoop);
    this._loop()
  }

  _restoreLoop = () => {
    console.log('tab is active again!')

    if (document.visibilityState === 'visible') {
      this.tick = performance.now()

      this.animation = true
      this._loop();
    } else {
      console.log('go offline')
      this.animation = false
    }
  }

  _loop = () => {
    const delta = (performance.now() - this.tick) / 1000;
    this.tick = performance.now()

    this._checkViewportCollisions()
    this._moveBalls(delta)
    this._renderBalls()

    if (this.animation) {
      requestAnimationFrame((_t: number) => this._loop());
    }
  }


  _moveBalls(delta: number) {
    this.balls.forEach((ball, index) => {
      ball.pos.x += ball.velocity.x * delta
      ball.pos.y += ball.velocity.y * delta

      // dissect balls that located too far from the viewport
      const error = ball.size * this._errorThreshold
      if (ball.pos.x < -error || ball.pos.x >= this.viewport.width + error ||
        ball.pos.y < -error || ball.pos.y >= this.viewport.height + error
      ) {
        this.removeBall(index)
      }

      // and stabilise that one that bumped into the wall a bit
      const massSize = ball.size / 2
      ball.pos.x = Math.max(massSize, Math.min(this.viewport.width - massSize, ball.pos.x))
      ball.pos.y = Math.max(massSize, Math.min(this.viewport.height - massSize, ball.pos.y))
    })
  }

  _checkViewportCollisions() {
    this.balls.forEach(ball => {
      const massSize = ball.size / 2

      if (ball.pos.x <= massSize || ball.pos.x >= this.viewport.width - massSize) {
        ball.velocity.x *= -1
      }

      if (ball.pos.y <= massSize || ball.pos.y >= this.viewport.height - massSize) {
        ball.velocity.y *= -1
      }
    })
  }

  _renderBalls() {
    this.balls.forEach(ball => {
      const {x, y} = ball.pos
      ball.el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    })
  }

  _getRandomVector(length: number) {
    // Generate a random angle in radians
    const angle = Math.random() * 2 * Math.PI;

    // Calculate the x and y components
    const x = Math.cos(angle) * length;
    const y = Math.sin(angle) * length;

    return { x, y };
  }

  _recalcViewport = () => {
    const { width, height } = this.root.getBoundingClientRect()

    this.viewport = {
      width,
      height,
    }
  }
}
