import TsaiAvatar from '@/components/TsaiAvatar.vue'
import { AvatarType } from '@/types'
import { render, screen } from '@testing-library/vue'
import { describe, expect, test } from 'vitest'

const name = 'Test'
const id = 'test'

// skipped because jsdom does not implement URL.createObjectURL and makes testing painful.
describe.skip('avatar component tests', () => {
  //Avatar component renders user name's first letter in it
  test('Render letter', () => {
    render(TsaiAvatar, {
      props: {
        name,
        id,
        type: AvatarType.USER
      }
    })
    screen.getByText(name[0]) //Should have displayed avatar's first letter
  })

  // Avatar component always renders an image
  test('Render image', async () => {
    render(TsaiAvatar, {
      props: {
        name,
        id,
        type: AvatarType.USER
      }
    })
    screen.getByRole('img')
  })

  //The image should have 'hidden' class if no image url provided
  test('Check if image is hidden', () => {
    render(TsaiAvatar, {
      props: {
        name,
        id,
        type: AvatarType.USER
      }
    })
    const el = screen.findByRole('img')
    expect(el).toBeUndefined()
  })

  //The image shouldn't have 'hidden' class if image url provided
  test('Check if image is shown', async () => {
    render(TsaiAvatar, {
      props: {
        name,
        id,
        type: AvatarType.USER
      }
    })
    const el = screen.getByRole('img')
    const isHidden = el.classList.contains('hidden')
    expect(isHidden).toBe(false)
  })
})
