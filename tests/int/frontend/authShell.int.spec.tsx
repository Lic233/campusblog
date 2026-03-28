import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AuthShell from '@/components/auth/AuthShell'

describe('AuthShell', () => {
  it('renders the auth experience with layered surfaces instead of the old glass card', () => {
    const { container } = render(
      <AuthShell
        appName="Campus Blog"
        mode="login"
        loginTitle="Welcome back"
        registerTitle="Create account"
        loginDescription="Log in to keep writing."
        registerDescription="Create an account to publish."
        backLabel="Back home"
        loginLabel="Login"
        registerLabel="Register"
        loginHref="/login"
        registerHref="/register"
      >
        <div>Form body</div>
      </AuthShell>,
    )

    expect(screen.getByText('Welcome back')).toBeTruthy()
    expect(screen.getByText('Form body')).toBeTruthy()
    expect(container.firstChild).toBeTruthy()
    expect(container.querySelector('.backdrop-blur-2xl')).toBeNull()
    expect(container.querySelector('.bg-gradient-to-br')).toBeTruthy()
  })
})
