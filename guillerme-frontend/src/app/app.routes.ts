import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { OrdersPage } from './shared/orders/orders.page';
import { AdminProductsPage } from './pages/admin-products/admin-products.page';
import { adminGuard } from './shared/guards/admin.guard';
import { AdminOrdersPage } from './pages/admin-orders/admin-orders.page';
import { Productos } from './components/productos/productos';
import { Presupuesto } from './components/presupuesto/presupuesto';
import { AdminHomePage } from './pages/admin-home/admin-home.page';
import { AdminCartPage } from './pages/admin-cart/admin-cart.page';
import { ResetPasswordPage } from './pages/login/reset-password.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
 { path: 'orders', component: OrdersPage },
 { path: 'admin/products', component: AdminProductsPage, canActivate: [adminGuard] },
 { path: 'admin/orders', component: AdminOrdersPage },
 {path: 'admin', component:AdminHomePage,},
 {path: 'admin/cartOrders', component:AdminCartPage,},
 {path: 'forgot-password', component:ForgotPasswordPage},
 {path: 'reset-password', component:ResetPasswordPage},
 { path: 'productos', component: Productos },
 { path: 'contacto', component: Presupuesto},
  { path: '**', redirectTo: '' }, // SIEMPRE al final
];