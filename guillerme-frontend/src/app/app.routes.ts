import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { OrdersPage } from './shared/orders/orders.page';
import { AdminProductsPage } from './pages/admin-products/admin-products.page';
import { adminGuard } from './shared/guards/admin.guard';
import { AdminOrdersPage } from './pages/admin-orders/admin-orders.page';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
 { path: 'orders', component: OrdersPage },
 {path: 'admin/products', component: AdminProductsPage},
 { path: 'admin/products', component: AdminProductsPage, canActivate: [adminGuard] },
 { path: 'admin/orders', component: AdminOrdersPage },
  { path: '**', redirectTo: '' }, // SIEMPRE al final
];