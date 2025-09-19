// Basic test to verify Jest setup is working
describe('Test Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true)
  })

  it('should have testing environment configured', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('should support modern JavaScript features', () => {
    const testArray = [1, 2, 3]
    const doubled = testArray.map(x => x * 2)
    expect(doubled).toEqual([2, 4, 6])
  })

  it('should support async/await', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => setTimeout(() => resolve('success'), 10))
    }

    const result = await asyncFunction()
    expect(result).toBe('success')
  })
})