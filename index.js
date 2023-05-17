const UP = 'UP'
const DOWN = 'DOWN'
const PENDING = 'PENDING'
const CLOSE = 'CLOSE'

const MAX_FLOOR = 16

const { log } = console

class Elevator {
  // 启动时间 (时间戳, 进入pending后重置)
  runningStartTs = null

  // 当前承重容量
  currentTotalWeight = 0
  // 当前乘坐的负载实体集合
  currentLoadList = []
  // 当前停留楼层
  currentFloor = 1
  // 当前电梯方向 UP / DOWN / PENDING / CLOSE
  currentStatus = CLOSE
  // 当前选中楼层 (负载输入的, 电梯要去的几个楼层)
  // 如果该电梯 call 中了, 那么需要将call 的楼层 push 进来
  targetFloorList = new Set()

  constructor(baseConfig) {
    // 电梯唯一标识
    this.id = baseConfig.id
    // 初始化容量 —— 总承重(kg)
    this.weightCapacity = baseConfig.weightCapacity
    // 可停留目标楼层(默认包含第一层)
    this.standingFloorList = baseConfig.standingFloorList
    // 电梯打开时自动关闭时间 (秒)
    this.autoCloseDuration = baseConfig.autoCloseDuration || 180
    // 电梯移动速度 (移动一层所耗时间 单位秒s)
    this.speed = baseConfig.speed || 20
    // 电梯单位能耗 (移动一层所耗的电 or 资源 whatever)
    this.cost = baseConfig.cost || 10
  }
  start = () => {
    // 1. CLOSE ——> pending
    // 2. 开始running 等待 call
    this.currentStatus = PENDING
  }
  // 每单位时间speed执行一次
  running = () => {
    if (this.currentStatus === CLOSE) {
      return
    }
    switch (this.currentStatus) {
      case PENDING:
        break;
      case UP:
        this.currentFloor < MAX_FLOOR && this.currentFloor++
        break;
      case DOWN:
        this.currentFloor > 1 && this.currentFloor--
        break;
      default:
        break;
    }
    // TODO: 如果当前层有人下, 需要停一下, 并且减去负载
    // TODO: 并且，如果当前层人下完了, 进入 pending 状态
  }
  checkCapacityAvailable = () => {
    return this.weightCapacity - this.currentTotalWeight > 70
  }
  addTargetFloor = floor => {
    this.targetFloorList.add(floor)
  }
}

// 真实场景下在进入电梯前，电梯是不知道这个实体的负载的
class Load {
  constructor(loadConfig) {
    // 重量
    this.weight = loadConfig.weight
    // 当前楼层
    this.currentFloor = 1
  }
  call = (schedule, direction) => {
    // 召唤电梯
    // 上了之后，把这个负载装到指定电梯
    // 1. 获取所有电梯状态，取可以添加负载的电梯
    // 2. 过滤出方向相同的电梯，取距离该楼层最短的电梯
    schedule.callElevator({
      direction,
      waitingFloor: this.currentFloor,
    })
  }
  
}

// 调度中心，负责所有电梯的运行状态管理
class ScheduleCenter {
  static TotalFloors = 32
  constructor() {
    this.elevatorCollection = []
    // 呼叫队列, 每5秒消费一次, 处理并发下的最优解
    this.callList = []
  }

  get availableElevatorList() {
    return this.elevatorCollection.filter(e => 
      e.currentStatus !== CLOSE 
      && e.checkCapacityAvailable()
    )
  }

  add = elevator => {
    this.elevatorCollection.push(elevator)
  }

  autoRunAllElevator = () => {
    this.elevatorCollection.forEach(e => e.start())
    this.doRunning()
  }

  // 每秒执行，打印当前电梯状态
  doRunning = () => {
    log(this.elevatorCollection)
    setTimeout(this.doRunning, 1e3)
  }

  callElevator = ({ direction, waitingFloor }) => {
    const list = this.availableElevatorList.filter(v => {
      if (v.currentStatus === PENDING) return true
      if (v.currentStatus === direction) {
        if (direction === UP) {
          return v.currentFloor < waitingFloor
        } else {
          return v.currentFloor > waitingFloor
        }
      }
      return false
    })

    const targetElevator = this.calcMinTimeElevator(list, waitingFloor)
    if (!targetElevator) throw new Error('无可用电梯')
    this.callList.push(waitingFloor)
  }

  calcMinTimeElevator = (elevatorList, waitingFloor) => {
    let d = Infinity, ans
    for(const e of elevatorList) {
      const curD = Math.abs(e.currentFloor - waitingFloor)
      if (curD < d) {
        ans = e
        d = curD
      }
    }
    return ans
  }
}

const schedule = new ScheduleCenter()
schedule.add(
  new Elevator({
    id: 1,
    weightCapacity: 1000,
    standingFloorList: [],
    autoCloseDuration: 180,
    singleElevatorSpeed: 20,
  })
)
schedule.add(
  new Elevator({
    id: 2,
    weightCapacity: 2000,
    standingFloorList: [],
    autoCloseDuration: 180,
    singleElevatorSpeed: 20,
  }),
)
schedule.autoRunAllElevator()

const personA = new Load({ weight:60 })
personA.call(schedule, UP)
