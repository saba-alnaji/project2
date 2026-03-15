import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import LoanPage from "./pages/borrow/LoanPage";
import ReturnLoanPage from "./pages/borrow/ReturnLoanPage";
import LateReturnPage from "./pages/borrow/LateReturnPage";
import AlertsPage from "./pages/notifications/AlertsPage";
import OnlineRequestsPage from "./pages/online-orders/OnlineRequestsPage";
import GeneralReportsPage from "./pages/reports/GeneralReportsPage";
import PersonalReportPage from "./pages/reports/PersonalReportPage";
import NewSubscriptionForm from "./pages/subscriptions/NewSubscriptionForm";
import EditSubscriptionPage from "./pages/subscriptions/EditSubscriptionPage";
import RenewSubscriptionPage from "./pages/subscriptions/RenewSubscriptionPage";
import NotFound from "./pages/NotFound";
import Home from "./pages/home/Home";


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "loan", element: <LoanPage /> },
      { path: "return-loan", element: <ReturnLoanPage /> },
      { path: "late-returns", element: <LateReturnPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "online-requests", element: <OnlineRequestsPage /> },
      { path: "reports", element: <GeneralReportsPage /> },
      { path: "personal-reports", element: <PersonalReportPage /> },
      { path: "subscription/new", element: <NewSubscriptionForm /> },
      { path: "subscription/edit", element: <EditSubscriptionPage /> },
      { path: "subscription/renew", element: <RenewSubscriptionPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
