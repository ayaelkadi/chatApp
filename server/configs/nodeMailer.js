import nodemailer from "nodemailer"

const transpoter = nodemailer.createTransport({
    host:"smtp.mailersend.net",
    port:587,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    }
})

const sendEmail = async ({to, subject, body})=> {
    const response = await transpoter.sendEmail({
        from:process.env.SENDER_EMAIL,
        subject,
        html:body
    })

    return response
}

export default sendEmail