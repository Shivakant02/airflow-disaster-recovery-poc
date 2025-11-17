"""
Disaster Recovery DAG 2
This DAG runs hourly and contains 4 tasks for disaster recovery testing
"""
from datetime import datetime, timedelta
import time
import random
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

def backup_task_function(**context):
    """Backup processing task"""
    execution_time = random.uniform(5, 10)
    print(f"Executing Backup Task at {datetime.now()}")
    print(f"Creating backup snapshots... (will take {execution_time:.2f} seconds)")
    
    # Simulate backup process with random sleep
    for i in range(1, 4):
        print(f"  - Backing up partition {i}/3...")
        time.sleep(execution_time / 3)
    
    print(f"Backup task completed at {datetime.now()}")
    return f"Backup task completed successfully in {execution_time:.2f} seconds"

def validation_task_function(**context):
    """Validation processing task"""
    execution_time = random.uniform(5, 10)
    print(f"Executing Validation Task at {datetime.now()}")
    print(f"Validating backup integrity... (will take {execution_time:.2f} seconds)")
    
    # Simulate validation process with random sleep
    for i in range(1, 4):
        print(f"  - Validating checksum {i}/3...")
        time.sleep(execution_time / 3)
    
    print(f"Validation task completed at {datetime.now()}")
    return f"Validation task completed successfully in {execution_time:.2f} seconds"

with DAG(
    'disaster_recovery_dag_2',
    default_args=default_args,
    description='Disaster Recovery DAG 2 - Hourly Backup and Validation',
    schedule_interval='@hourly',
    start_date=datetime(2025, 11, 1),
    catchup=False,
    tags=['disaster-recovery', 'hourly', 'backup'],
) as dag:

    # Start task
    start = EmptyOperator(
        task_id='start',
        dag=dag,
    )

    # Task 1 - Backup
    backup_task = PythonOperator(
        task_id='create_backup',
        python_callable=backup_task_function,
        provide_context=True,
        dag=dag,
    )

    # Task 2 - Validation
    validation_task = PythonOperator(
        task_id='validate_backup',
        python_callable=validation_task_function,
        provide_context=True,
        dag=dag,
    )

    # End task
    end = EmptyOperator(
        task_id='end',
        dag=dag,
    )

    # Define task dependencies
    start >> backup_task >> validation_task >> end
