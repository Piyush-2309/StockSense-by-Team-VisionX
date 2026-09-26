import { Outlet } from 'react-router-dom';
import ToastContainer from '../components/common/ToastContainer';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
          <span className="text-primary-600">📦</span> StockSense
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Know your stock. Control every movement.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
      
      <ToastContainer />
    </div>
  );
}
