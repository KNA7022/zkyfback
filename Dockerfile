FROM node:18-alpine

WORKDIR /app

# 复制应用文件
COPY package*.json ./
RUN npm install --production

COPY . .

# 复制到抖音云期望的目录
RUN mkdir -p /opt/application
COPY . /opt/application/

# 创建启动脚本
RUN echo '#!/bin/sh' > /opt/application/run.sh
RUN echo 'cd /app && node server.js' >> /opt/application/run.sh
RUN chmod +x /opt/application/run.sh

EXPOSE 8000

CMD ["/bin/sh", "/opt/application/run.sh"]
