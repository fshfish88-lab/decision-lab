import { MobileHomeView } from '../mobile/pages/MobileHomeView'
import { usePlatform } from '../platform/PlatformContext'
import { WebHomeView } from '../web/pages/WebHomeView'
import { useHomePageController } from './home/HomePageController'

export function HomePage(): React.JSX.Element {
  const platform = usePlatform()
  const viewProps = useHomePageController()

  return platform === 'app'
    ? <MobileHomeView {...viewProps} />
    : <WebHomeView {...viewProps} />
}
