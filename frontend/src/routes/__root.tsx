import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import Header from '../components/Header'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Log Monitoring System',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-950">
        <div className="relative min-h-screen overflow-hidden">
          <DottedGlowBackground
            className="mask-radial-to-90% mask-radial-at-center"
            opacity={1}
            gap={14}
            radius={1.4}
          />
          <div className="relative z-10">
            <Header />
            {children}
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
