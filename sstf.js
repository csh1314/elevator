const log = console.log
/**  struct  */
// 有序集合, mock一下
class OrderedSet {
  data = null

  constructor(Iterable) {
    const source = Array.from(Iterable)
    const sort = source.sort((a,b) => a-b)
    this.data = new Set(sort)
  }

  get size() {
    return this.data.size
  }

  getMin = () => {
    return [...this.data][0]
  }

  getMax = () => {
    return [...this.data][this.size - 1]
  }

  add = (val) => {
    this.data.add(val)
    this.data = new Set([...this.data].sort((a,b) => a-b))
  }

  delete = (val) => {
    this.data.delete(val)
  }

  has = (val) => this.data.has(val)
}


/** constant  */
const MAX_FLOOR = 32
const SPEED = 10  // 10s 移动 1层
const AUTO_CLOSE_TIME = 60 // 停靠时固定 60s (mock)

const elevatorList = [
  {
    id: 1,
    status: 'UP',
    currentLoad: 662,
    currentFloor: 2,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([3, 5, 6, 10, 15]),
    downFloorList: new OrderedSet([10, 13]),
  },
  {
    id: 2,
    status: 'DOWN',
    currentLoad: 662,
    currentFloor: 5,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([10]),
    downFloorList: new OrderedSet([5, 7, 8]),
  },
  {
    id: 3,
    status: 'UP',
    currentLoad: 0,
    currentFloor: 1,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([20, 25, 31]),
    downFloorList: new OrderedSet([17]),
  },
  {
    id: 4,
    status: 'PENDING',
    currentLoad: 0,
    currentFloor: 1,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([]),
    downFloorList: new OrderedSet([]),
  },
  {
    id: 5,
    status: 'PENDING',
    currentLoad: 0,
    currentFloor: 20,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([]),
    downFloorList: new OrderedSet([]),
  },
  {
    id: 6,
    status: 'UP',
    currentLoad: 0,
    currentFloor: 8,
    MAX_LOAD: 1000,
    upFloorList: new OrderedSet([18, 32]),
    downFloorList: new OrderedSet([10, 15, 19]),
  }
]

const personList = [
  {
    id: 1,
    waitingFloor: 16,
    direction: 'DOWN'
  },
  {
    id: 2,
    waitingFloor: 3,
    direction: 'UP'
  },
  {
    id: 3,
    waitingFloor: 4,
    direction: 'UP'
  },
  {
    id: 4,
    waitingFloor: 10,
    direction: 'DOWN'
  },
  {
    id: 5,
    waitingFloor: 23,
    direction: 'UP'
  },
  {
    id: 6,
    waitingFloor: 6,
    direction: 'UP'
  },
  {
    id: 7,
    waitingFloor: 31,
    direction: 'DOWN'
  },
]

/**
 * @description 总的时间 = 移动的时间 + 停靠的时间
 */
function calcWaitingTime(elevator, person) {
  switch(elevator.status) {
    case 'PENDING':
      const distance = Math.abs(elevator.currentFloor - person.waitingFloor)
      return distance * SPEED
    case 'UP':
      if (person.direction === 'UP') {
        if (person.waitingFloor >= elevator.currentFloor) {
          // 1. 向上但是还没超过这个楼层
          // 移动的时间
          let time = Math.abs(elevator.currentFloor - person.waitingFloor) * SPEED
          for(const f of elevator.upFloorList.data) {
            if (f > elevator.currentFloor) {
              break
            }
            // 停的时间
            time += AUTO_CLOSE_TIME
          }
          // 移动的时间 + 停的时间
          return time
        } else {
          // 2. 超过了这个楼层, 先【↑】后【↓】, 然后再来接他
          // 移动的时间 = (max - cur) + (max - min) + Math.abs(min - waitingFloor)
          // 停靠的时间 = (up.size + down.size) * AUTO_CLOSE_TIME
          const max = elevator.upFloorList.getMax()
          const min = elevator.downFloorList.getMin()
          const moveTime = ((max - elevator.currentFloor) + (max - min) + Math.abs(min - person.waitingFloor)) * SPEED
          const standingTime = (elevator.upFloorList.size + elevator.downFloorList.size) * AUTO_CLOSE_TIME
          return moveTime + standingTime
        }
      } else {
        if (person.waitingFloor <= elevator.upFloorList.getMax()) {
          // 先上去然后下来接他下去
          // move: up.max - cur + up.max - waitingFloor
          // standing: up.size + downUpper size
          const max = elevator.upFloorList.getMax()
          const moveTime = ((max - elevator.currentFloor) + (max - person.waitingFloor)) * SPEED
          let standingTime = upFloorList.size * AUTO_CLOSE_TIME
          for(const f of elevator.downFloorList.data) {
            if (f > person.waitingFloor) {
              standingTime += AUTO_CLOSE_TIME
            }
          }
          return moveTime + standingTime
        } else {
          // 先上去完然后继续上去接他，然后下去
          // move: waitingFloor - cur
          // standing: up.size
          return (person.waitingFloor - elevator.currentFloor) * SPEED + elevator.upFloorList.size * AUTO_CLOSE_TIME
        }
      }
    case 'DOWN':
      if (person.direction === 'UP') {
        if (person.waitingFloor <= elevator.downFloorList.getMin()) {
          // 先下去完然后继续下去接他，然后上去
          // move: cur - waitingFloor
          // standing: down.size
          return (elevator.currentFloor - person.waitingFloor) * SPEED + elevator.downFloorList.size * AUTO_CLOSE_TIME
        } else {
          // 先下去完然后再上
          // move: cur - down.min + waitingFloor - down.min
          // standing: down.size + lower waiting up size
          const min = elevator.downFloorList.getMin()
          const moveTime = (elevator.currentFloor - min + person.waitingFloor - min) * SPEED
          let standingTime = elevator.downFloorList.size * AUTO_CLOSE_TIME
          for(const f of elevator.upFloorList.data) {
            if (f < person.waitingFloor) standingTime += AUTO_CLOSE_TIME
          }
          return moveTime + standingTime
        }
      } else {
        if (person.waitingFloor <= elevator.currentFloor) {
          // 可以向下直接接上
          // move: cur - waitingFloor
          // standing: upper down size
          const moveTime = (elevator.currentFloor - person.waitingFloor) * SPEED
          let standingTime = 0
          for(const f of elevator.downFloorList.data) {
            if (f > person.waitingFloor) standingTime += AUTO_CLOSE_TIME
          }
          return moveTime + standingTime
        } else {
          // 已经错过了, 先下去再上来接他下去
          if (!elevator.upFloorList.size) {
            // 如果up是空的话
            // move: cur - down.min
            // standing: down.size
            const min = elevator.downFloorList.getMin()
            return (elevator.currentFloor - min) * SPEED + elevator.downFloorList.size * AUTO_CLOSE_TIME
          } else {
            // 如果不为空，太恶心了，还得上去之后再下来, 总之先把两个搞完
            const max = elevator.upFloorList.getMax()
            const min = elevator.downFloorList.getMin()
            return (elevator.currentFloor - min + max - min) * SPEED + (elevator.downFloorList.size + elevator.upFloorList.size) * AUTO_CLOSE_TIME
          }
        }
      }
    default:
      break
  }
  return Infinity
}

/**
 * key: elevator id
 * value: floor => priorityValue [1, 3]
 * 
 * 根据时间段 or something 配置不同楼层的权重
 */
const timeStrategyMap = {
  1: (floor) => {
    const h = new Date().getHours()
    const m = new Date().getMinutes()
    // 9:30 - 10:30 和 17:50 - 18:30 时, 给 10到16楼 分配权重大些
    if (inTimeRange(['9:30', '10:30'], [h, m])) {
      if (floor >= 10 && floor <= 16) {
        return 3
      }
    }
    if (inTimeRange(['17:50', '18:30'], [h, m])) {
      if (floor >= 10 && floor <= 16) {
        return 3
      }
    }
    // 9:30 - 10:30 和 17:50 - 18:30 时, 给 10到16楼 分配权重大些
    if (inTimeRange(['8:30', '9:30'], [h, m])) {
      if (floor >= 3 && floor <= 8) {
        return 3
      }
    }
    return 1
  },
  2: (floor) => {
    return 1
  },
  3: () => 1,
  4: () => 1,
  5: () => 1,
  6: () => 1,
}

/**
 * 
 * @param {*} range exp: [start, end] => [10:10, 11:10]
 * @param {*} time  exp: absolute 10:15 => [10, 15]
 */
function inTimeRange(range, time) {
  const [h, m] = time
  const [startH, startM] = range[0].split(':').map(Number)
  const [endH, endM] = range[1].split(':').map(Number)
  if (h > startH && h < endH) {
    return true
  }
  if (h === startH) {
    if (endH > startH) return m >= startM
    else return m >= startM && m <= endM
  }
  if (h === endH) {
    return m <= endM
  }
  return false
}

/**
 * @description sstf 最短寻路分配
 * 输出支配方案一个方案
 * [
 *  {人、分配到的电梯、需等待时间}
 * ]
 */
function shortestSeekTimeFirst(elevatorList, personList) {
  const result = []
  for(const p of personList) {
    // 权重map
    const valueMap = {}
    for(const e of elevatorList) {
      let d = 0
      switch (e.status) {
        case 'PENDING':
          d = Math.abs(p.waitingFloor - e.currentFloor)
          break
        case 'UP':
          if (p.direction === 'UP') {
            if (p.waitingFloor >= e.currentFloor) {
              d = Math.abs(p.waitingFloor - e.currentFloor)
            } else {
              const max = e.upFloorList.getMax()
              const min = e.downFloorList.getMin()
              d = Math.abs(max - e.currentFloor) + Math.abs(max - min) + p.waitingFloor
            }
          } else {
            const max = e.upFloorList.getMax()
            d = Math.abs(max - e.currentFloor) + Math.abs(max - p.waitingFloor)
          }
          break
        case 'DOWN':
          if (p.direction === 'DOWN') {
            if (p.waitingFloor <= e.currentFloor) {
              d = Math.abs(p.waitingFloor - e.currentFloor)
            } else {
              const max = e.upFloorList.getMax()
              const min = e.downFloorList.getMin()
              d = Math.abs(min - e.currentFloor) + Math.abs(max - min) + Math.abs(max - p.waitingFloor)
            }
          } else {
            const min = e.downFloorList.getMin()
            d = Math.abs(e.currentFloor - min) + Math.abs(p.waitingFloor - min)
          }
          break
        default:
          break
      }
      // 根据 priorityMap 综合计算权重来指派
      // 计算公式:  MAX_FLOOR / 移动距离 + getPriority(floor, elevator)
      valueMap[e.id] = MAX_FLOOR / d + timeStrategyMap[e.id](p.waitingFloor)
    }
    
    // 根据valueMap 计算权重来指派, 取权重最大的
    let targetElevatorId = -1, max = -1
    for(const [id, val] of Object.entries(valueMap)) {
      if (val > max) {
        targetElevatorId = id
        max = val
      }
    }
    const targetElevator = elevatorList.find(v => v.id === +targetElevatorId)
    if (!targetElevator) throw new Error('无可用电梯')
    result.push({
      p_id: p.id,
      e_id: targetElevator.id,
      waitingTime: `${calcWaitingTime(targetElevator, p)}秒`,
      valueMap,
    })
  }
  return result
}

const output = shortestSeekTimeFirst(elevatorList, personList)
log(output)
log(`output ====>
${output.map(({ p_id, e_id, waitingTime }) => `电梯${e_id} 分配给 人${p_id}, 需等待: ${waitingTime}`).join('\n')}
`)
