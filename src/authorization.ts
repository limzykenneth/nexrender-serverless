import {JWTPayload, JWTHeaderParameters} from "jose";

const authorization: Record<string, (payload: JWTPayload, protectedHeader: JWTHeaderParameters) => boolean> = {
	default(payload: JWTPayload, protectedHeader: JWTHeaderParameters){
		return true;
	}
};

export default authorization;