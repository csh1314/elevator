// simple mock
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
}