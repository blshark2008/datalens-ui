import React from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';
import {UserRole} from 'shared/components/auth/constants/role';

import {useSelector} from 'react-redux';
import coreReducers from 'store/reducers';
import {getIsAsideHeaderEnabled} from 'components/AsideHeaderAdapter';
import LocationChange from '../components/LocationChange/LocationChange';
import {selectIsLanding} from 'store/selectors/landing';
import FallbackPage from './pages/FallbackPage/FallbackPage';
import DashAndWizardQLPages, {
    dashAndWizardQLRoutes,
} from './pages/DashAndWizardQLPages/DashAndWizardQLPages';
import {locationChangeHandler} from './helpers';
import {isEmbeddedMode, isTvMode} from '../utils/embedded';
import {reducerRegistry} from '../store';
import {AsideHeaderAdapter} from 'ui/components/AsideHeaderAdapter/AsideHeaderAdapter';
import {MobileHeaderComponent} from 'ui/components/MobileHeader/MobileHeaderComponent/MobileHeaderComponent';
import {DL} from 'ui/constants';
import {useClearReloadedQuery} from '../units/auth/hooks/useClearReloadedQuery';
import {reducer} from 'ui/units/auth/store/reducers';
import {useIframeRender} from './hooks';
import {OPEN_SOURCE_INSTALLATION_INFO} from 'ui/constants/navigation';
import {chartkitApi} from 'ui/store/toolkit/chartkit/api';
import {DataLoaderApp} from 'ui/units/data-loader/components/DataLoaderApp/DataLoaderApp';
import {DashboardsList} from 'ui/datalens/pages/DashboardsList/DashboardsList';
import {DashboardPermissions} from 'ui/datalens/pages/DashboardPermissions/DashboardPermissions';
import type {IconData} from '@gravity-ui/uikit';


function createIconFromSvg(svgText: string): IconData | undefined {
    if (!svgText) return undefined;
    return (props: React.SVGProps<SVGSVGElement>) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            if (!svgEl) return null as any;
            const viewBox = svgEl.getAttribute('viewBox') || '0 0 32 32';
            return React.createElement('svg', {
                ...props,
                viewBox,
                dangerouslySetInnerHTML: {__html: svgEl.innerHTML},
            });
        } catch {
            return null as any;
        }
    };
}


reducerRegistry.register(coreReducers);
reducerRegistry.register({auth: reducer});
reducerRegistry.register({chartkitApi: chartkitApi.reducer});

reducerRegistry.registerMiddleware(chartkitApi.middleware);

const DatasetPage = React.lazy(() => import('./pages/DatasetPage/DatasetPage'));
const PreviewPage = React.lazy(() => import('./pages/PreviewPage/PreviewPage'));
const ConnectionsPage = React.lazy(
    () =>
        import(
            /* webpackChunkName: "connections-page" */ './pages/ConnectionsPage/ConnectionsPage'
        ),
);
// comment till we have main page
// const MainPage = React.lazy(() => import('./pages/MainPage/MainPage'));
const CollectionsNavigtaionPage = React.lazy(
    () => import('./pages/CollectionsNavigationPage/CollectionsNavigationPage'),
);
const ServiceSettings = React.lazy(() => import('./pages/ServiceSettingsPage/ServiceSettingsPage'));
const UserProfile = React.lazy(() => import('./pages/OwnUserProfilePage/OwnUserProfilePage'));

const LandingPage = React.lazy(() => import('./pages/LandingPage/LandingPage'));
const AuthPage = React.lazy(
    () => import(/* webpackChunkName: "auth-page" */ './pages/AuthPage/AuthPage'),
);

	
const HandDataPage = React.lazy(() => import('./pages/HandDataPage/HandDataPage'));
	
	
	
const DatalensPageView = () => {
    useClearReloadedQuery();

    const isLanding = useSelector(selectIsLanding);

    if (isLanding) {
        return (
            <React.Suspense fallback={<FallbackPage />}>
                <LandingPage />
            </React.Suspense>
        );
    }

    if (DL.IS_AUTH_PAGE) {
        return (
            <React.Suspense fallback={<FallbackPage />}>
                <AuthPage />
            </React.Suspense>
        );
    }

    return (
        <React.Suspense fallback={<FallbackPage />}>
            <Switch>
                {DL.AUTH_ENABLED && <Route path="/auth" component={AuthPage} />}

                <Route
                    path={['/workbooks/:workbookId/datasets/new', '/datasets/:id']}
                    component={DatasetPage}
                />

                <Route path="/preview" component={PreviewPage} />

                {/* Prevent attempts to create a standalone (outside of workbook) connection */}
				<Route path={['/connections/new/:type', '/connections/new']}>
					<Redirect to={`/collections${location.search}`} />
				</Route>

                <Route
                    path={[
                        '/connections/:id',
                        '/workbooks/:workbookId/connections/new/:type',
                        '/workbooks/:workbookId/connections/new',
                    ]}
                    component={ConnectionsPage}
                />

                {DL.AUTH_ENABLED && <Route path="/profile" component={UserProfile} />}

                <Route path="/settings" component={ServiceSettings} />

                <Route path="/data-loader" component={DataLoaderApp} />

				<Route path="/hand-data" component={HandDataPage} />

                <Route path="/dashboards-list" component={DashboardsList} />
                
                <Route path="/dashboard-permissions" component={DashboardPermissions} />

                <Route path={['/collections']} component={CollectionsNavigtaionPage} />

                <Route exact path={dashAndWizardQLRoutes} component={DashAndWizardQLPages} />

                <Route
                    path={['/collections/:collectionId', '/workbooks/:workbookId']}
                    component={CollectionsNavigtaionPage}
                />

                <Route path="/">
                        <Redirect
							to={
								DL.USER?.roles?.includes(UserRole.Viewer)
									? '/dashboards-list'
									: `/collections${location.search}`
							}
						/>
                </Route>

                {/* comment till we have main page */}
                {/*<Route path="/" component={MainPage} />*/}
            </Switch>
            <LocationChange onLocationChanged={locationChangeHandler} />
        </React.Suspense>
    );
};

const DatalensPage: React.FC = () => {
    const showAsideHeaderAdapter = getIsAsideHeaderEnabled() && !isEmbeddedMode() && !isTvMode();
    const showMobileHeader =
        !isEmbeddedMode() && DL.IS_MOBILE && !DL.IS_NOT_AUTHENTICATED && !DL.IS_AUTH_PAGE;

    useIframeRender();

	let serverLogoConfig = {logoText: '', logoIcon: '', installationInfo: ''};
	try {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', '/logo-config.json', false);
		xhr.send();
		if (xhr.status === 200) {
			serverLogoConfig = JSON.parse(xhr.responseText);
		}
	} catch (e) {}

	const customLogoIconSvg = serverLogoConfig.logoIcon || '';
	const customLogoText = serverLogoText.logoText || '';
	const customInstallationInfo = serverLogoConfig.installationInfo || '';



    const customLogoIcon = createIconFromSvg(customLogoIconSvg);
    const logoTextProps = {
        installationInfo: customInstallationInfo || OPEN_SOURCE_INSTALLATION_INFO,
        ...(customLogoText ? {productName: customLogoText} : {}),
    };


    if (showMobileHeader) {
        return (
            <MobileHeaderComponent
                renderContent={() => <DatalensPageView />}
                logoIcon={customLogoIcon}
                logoTextProps={logoTextProps}
            />
        );
    }

    if (showAsideHeaderAdapter) {
        return (
            <AsideHeaderAdapter
                renderContent={() => <DatalensPageView />}
                logoIcon={customLogoIcon}
                logoTextProps={logoTextProps}
            />
        );
    }


    return <DatalensPageView />;
};

export default DatalensPage;
