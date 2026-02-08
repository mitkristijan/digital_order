export declare const isValidEmail: (email: string) => boolean;
export declare const isValidPhone: (phone: string) => boolean;
export declare const isValidSubdomain: (subdomain: string) => boolean;
export declare const isValidUrl: (url: string) => boolean;
export declare const sanitizePhone: (phone: string) => string;
export declare const validatePassword: (password: string) => {
    valid: boolean;
    errors: string[];
};
