import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SalinityCalculator } from '../../features/salinity/SalinityCalculator'
import { Provider } from '../../components/ui/provider'
import type { ReactNode } from 'react'

vi.mock('../../config', () => ({
  config: { apiBaseUrl: 'http://localhost:8000', apiToken: 'test-token' },
  isConfigured: () => true,
  configErrors: () => [],
}))

// next-themes calls window.matchMedia; re-apply each test since restoreAllMocks clears vi.fn() stubs
function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function Wrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

const renderCalculator = () =>
  render(<SalinityCalculator />, { wrapper: Wrapper })

beforeEach(() => { mockMatchMedia() })
afterEach(() => { vi.restoreAllMocks() })

describe('SalinityCalculator', () => {
  it('renders all three input fields', () => {
    renderCalculator()
    expect(screen.getByPlaceholderText('e.g. 200')).toBeInTheDocument()  // volume
    expect(screen.getByPlaceholderText('e.g. 0')).toBeInTheDocument()    // current
    expect(screen.getByPlaceholderText('e.g. 35')).toBeInTheDocument()   // target
  })

  it('shows the Calculate button', () => {
    renderCalculator()
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument()
  })

  it('shows empty state guidance before any calculation', () => {
    renderCalculator()
    expect(screen.getByText(/enter your tank volume/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    renderCalculator()
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByText(/enter a volume/i)).toBeInTheDocument()
  })

  it('shows error when target salinity <= current', async () => {
    const user = userEvent.setup()
    renderCalculator()
    await user.type(screen.getByPlaceholderText('e.g. 200'), '100')
    await user.type(screen.getByPlaceholderText('e.g. 0'), '35')
    await user.type(screen.getByPlaceholderText('e.g. 35'), '30')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByText(/target salinity must be higher/i)).toBeInTheDocument()
  })

  it('calls the API and displays the result', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dose: 150.5 }),
    }))
    renderCalculator()
    await user.type(screen.getByPlaceholderText('e.g. 200'), '200')
    await user.type(screen.getByPlaceholderText('e.g. 0'), '0')
    await user.type(screen.getByPlaceholderText('e.g. 35'), '35')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByText('150.5 g')).toBeInTheDocument()
  })

  it('shows an error message when the API call fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderCalculator()
    await user.type(screen.getByPlaceholderText('e.g. 200'), '100')
    await user.type(screen.getByPlaceholderText('e.g. 0'), '0')
    await user.type(screen.getByPlaceholderText('e.g. 35'), '35')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    expect(await screen.findByText(/could not reach/i)).toBeInTheDocument()
  })
})
