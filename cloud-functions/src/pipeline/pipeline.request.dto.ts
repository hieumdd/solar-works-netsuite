import Joi from 'joi';

type LoadFromGCSBody = {
    filename: string;
};

export const LoadFromGCSBodySchema = Joi.object<LoadFromGCSBody>({
    filename: Joi.string().required(),
});
